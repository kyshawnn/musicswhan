import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  PlusCircle,
  ListPlus,
  User,
  History,
  Check,
  Shuffle,
  Loader2,
  Radio,
  Plus,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface FeaturedArtist {
  name: string;
  image: string;
  artistId?: string;
  subscribers?: string;
}

interface CommunityPlaylist {
  id: string;
  title: string;
  trackCount?: number | string;
  covers?: string[];
  gridCovers?: string[];
  tracks?: Song[];
  songs?: Song[];
}

interface SimilarSection {
  artist: {
    name: string;
    artistId?: string;
    image: string;
  };
  tracks?: Song[];
  songs?: Song[];
}

interface GenreItem {
  name: string;
  color?: string;
  gradient?: string;
}

interface HomeSectionsData {
  pilihan?: Song[];
  pamungkasSection?: SimilarSection;
  top50Indonesia?: Song[];
  surrenderToTheBeat?: Song[];
  funThrowbacks?: Song[];
  moreLikeChill?: Song[];
  suasanaHatiDanGenre?: GenreItem[];
  communityPlaylists?: CommunityPlaylist[];
  listeningArtists?: FeaturedArtist[];
  trendingNow?: Song[];
  newReleases?: Song[];
  similarSections?: SimilarSection[];
  viralTikTok?: Song[];
  feelGoodRock?: Song[];
  acousticChill?: Song[];
  eidGetaways?: Song[];
}

export const HomeView: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    isLiked,
    toggleLike,
    addToQueue,
    setTrackToAddToPlaylist,
    openArtist,
    openPlaylist,
    openGenre,
    setCurrentView,
    setIsHistoryOpen,
  } = useMusic();

  const [songs, setSongs] = useState<Song[]>([]);
  const [quickPicks, setQuickPicks] = useState<Song[]>([]);
  const [sectionsData, setSectionsData] = useState<HomeSectionsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activePill, setActivePill] = useState<string>('Beranda');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleOpenCommunityPlaylist = async (playlist: CommunityPlaylist) => {
    const plTracks = playlist.tracks || playlist.songs || [];

    // Open immediately with initial tracks
    openPlaylist({
      id: playlist.id,
      name: playlist.title,
      description: `Playlist Komunitas • ${playlist.trackCount || plTracks.length || '100'} lagu`,
      image: playlist.covers?.[0] || playlist.gridCovers?.[0],
      songs: plTracks,
      createdAt: Date.now(),
    });

    // Fetch full 100+ songs from scraper in background and update playlist
    try {
      const res = await fetch(
        `/api/community-playlist-songs?id=${encodeURIComponent(playlist.id)}&title=${encodeURIComponent(
          playlist.title
        )}`
      );
      if (res.ok) {
        const fullSongs: Song[] = await res.json();
        if (Array.isArray(fullSongs) && fullSongs.length > 0) {
          openPlaylist({
            id: playlist.id,
            name: playlist.title,
            description: `Playlist Komunitas • ${fullSongs.length} lagu`,
            image: playlist.covers?.[0] || playlist.gridCovers?.[0],
            songs: fullSongs,
            createdAt: Date.now(),
          });
        }
      }
    } catch (e) {
      console.error('Error fetching full community playlist songs:', e);
    }
  };

  // Helper to pick 4 random songs
  const pickRandomSongs = (source: Song[], count: number = 4): Song[] => {
    if (!source || source.length === 0) return [];
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const handleShuffleQuickPicks = () => {
    if (songs.length > 0) {
      setQuickPicks(pickRandomSongs(songs, 4));
      showToast('Pilihan cepat diperbarui');
    }
  };

  // Fetch initial home songs & home sections data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch('/api/home-sections')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && typeof data === 'object') {
          setSectionsData(data);
          if (Array.isArray(data.trendingNow) && data.trendingNow.length > 0) {
            setSongs((prev) => (prev.length === 0 ? data.trendingNow : prev));
            setQuickPicks((prev) => (prev.length === 0 ? pickRandomSongs(data.trendingNow, 4) : prev));
          }
        }
      })
      .catch((err) => console.error('Error fetching home sections:', err));

    fetch('/api/home-songs')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setSongs(data);
          setQuickPicks(pickRandomSongs(data, 4));
        } else {
          fetch('/api/top-indonesia')
            .then((r2) => (r2.ok ? r2.json() : []))
            .then((topData) => {
              if (isMounted && Array.isArray(topData) && topData.length > 0) {
                setSongs(topData);
                setQuickPicks(pickRandomSongs(topData, 4));
              }
            })
            .catch(() => {});
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Standard horizontal square track card renderer (10+ songs scrollable)
  const renderHorizontalTrackCard = (song: Song, contextQueue: Song[], idx?: number) => {
    const isCurrent = currentSong?.videoId === song.videoId || currentSong?.id === song.id;
    const isSongPlaying = isCurrent && isPlaying;
    const liked = isLiked(song);

    return (
      <div
        key={`${song.id || song.videoId || 'card'}_${idx ?? ''}`}
        onClick={() => playSong(song, contextQueue)}
        className="w-[140px] sm:w-[155px] shrink-0 group flex flex-col cursor-pointer"
      >
        <div className="relative w-[140px] sm:w-[155px] h-[140px] sm:h-[155px] rounded-2xl overflow-hidden mb-2 bg-[#1C1C1E] border border-white/5 group-hover:border-white/20 transition-all shadow-md">
          <ImageWithSkeleton
            src={song.image}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Play status overlay */}
          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isCurrent && isSongPlaying ? (
              <div className="flex items-center gap-1 bg-black/60 px-3 py-2 rounded-full backdrop-blur-xs border border-white/10 shadow-lg">
                <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-1 h-5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse delay-150" />
                <span className="w-1 h-4.5 bg-emerald-400 rounded-full animate-pulse delay-100" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            )}
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

  // 3x3 Grid card renderer for "Pilihan" section
  const renderPilihanGrid = (pilihanSongs: Song[]) => {
    // Break into columns of 3 songs each for smooth horizontal 3x3 scrolling
    const columns: Song[][] = [];
    for (let i = 0; i < pilihanSongs.length; i += 3) {
      columns.push(pilihanSongs.slice(i, i + 3));
    }

    return (
      <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="w-[280px] sm:w-[320px] shrink-0 flex flex-col gap-2.5">
            {col.map((song, songIdx) => {
              const isCurrent = currentSong?.videoId === song.videoId || currentSong?.id === song.id;
              const isSongPlaying = isCurrent && isPlaying;
              const liked = isLiked(song);

              return (
                <div
                  key={`${song.id || song.videoId || 'pilihan'}_${colIdx}_${songIdx}`}
                  onClick={() => playSong(song, pilihanSongs)}
                  className={`flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer group ${
                    isCurrent
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-[#161618] hover:bg-[#202024] border border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0 shadow-md">
                      <img
                        src={song.image}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrent && isSongPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="w-1 h-4.5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCurrent ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-white/50 truncate mt-0.5">{song.artist}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    className={`p-2 rounded-full transition-transform active:scale-90 cursor-pointer ${
                      liked ? 'text-red-500' : 'text-white/30 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div id="home-view-container" className="pb-36 min-h-screen text-white select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1F1F23] border border-white/20 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* TOP HEADER */}
      <div className="sticky top-0 z-30 px-5 pt-4 pb-3 bg-[#0A0A0C]/85 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
        <h1 className="font-extrabold text-2xl tracking-tight text-white">
          Beranda
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white cursor-pointer"
            title="Riwayat Pemutaran"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentView('developer')}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 hover:text-white cursor-pointer"
            title="Profil / Tentang Pengembang"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Category Pill Bar */}
      <div className="px-4 py-3 border-b border-white/5 bg-[#0A0A0C]/40">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['Beranda', 'Santai', 'Energi', 'Fokus', 'Pesta', 'Romansa'].map((pill) => (
            <button
              key={pill}
              onClick={() => {
                setActivePill(pill);
                if (pill !== 'Beranda') {
                  const mappedGenre =
                    pill === 'Santai'
                      ? 'Chill'
                      : pill === 'Energi'
                      ? 'Energy'
                      : pill === 'Fokus'
                      ? 'Focus'
                      : pill === 'Pesta'
                      ? 'Party'
                      : pill === 'Romansa'
                      ? 'Romance'
                      : pill;
                  openGenre(mappedGenre);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                activePill === pill
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-[#18181A] text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SECTIONS CONTAINER */}
      <div className="px-4 py-5 max-w-7xl mx-auto space-y-9">
        {/* 1. PILIHAN CEPAT */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pilihan Cepat
            </h2>

            <button
              onClick={handleShuffleQuickPicks}
              className="text-xs font-semibold text-white/50 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Acak
            </button>
          </div>

          {/* Quick picks list */}
          <div className="space-y-2">
            {isLoading && quickPicks.length === 0 ? (
              <div className="py-12 flex justify-center items-center text-white/40">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              quickPicks.map((song, idx) => {
                const isCurrent = currentSong?.videoId === song.videoId || currentSong?.id === song.id;
                const isSongPlaying = isCurrent && isPlaying;
                const liked = isLiked(song);
                const itemKey = `${song.id || song.videoId || 'qp'}-${idx}`;

                return (
                  <div
                    key={itemKey}
                    onClick={() => playSong(song, quickPicks)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer group ${
                      isCurrent
                        ? 'bg-white/10 border border-white/20'
                        : 'bg-[#161618] hover:bg-[#202024] border border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0 shadow-md">
                        <img
                          src={song.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
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

                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isCurrent ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-white/50 truncate mt-0.5">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleLike(song)}
                        className={`p-2 rounded-full transition-transform active:scale-90 cursor-pointer ${
                          liked ? 'text-red-500' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuSongId(
                              activeMenuSongId === (song.id || song.videoId) ? null : (song.id || song.videoId)
                            )
                          }
                          className="p-2 text-white/40 hover:text-white rounded-full transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuSongId === (song.id || song.videoId) && (
                          <div className="absolute right-0 top-10 w-48 bg-[#1E1E20] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-40">
                            <button
                              onClick={() => {
                                playSong(song, quickPicks);
                                setActiveMenuSongId(null);
                              }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white hover:bg-white/10 rounded-xl"
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
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white hover:bg-white/10 rounded-xl"
                            >
                              <ListPlus className="w-3.5 h-3.5" />
                              Tambah ke Antrean
                            </button>
                            <button
                              onClick={() => {
                                setTrackToAddToPlaylist(song);
                                setActiveMenuSongId(null);
                              }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white hover:bg-white/10 rounded-xl"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Tambah ke Playlist
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. FROM THE COMMUNITY (Horizontal Playlist Cards) */}
        {sectionsData?.communityPlaylists && sectionsData.communityPlaylists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                From the community
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
              {(sectionsData.communityPlaylists || []).map((playlist) => {
                const covers = (playlist.covers || playlist.gridCovers || []).slice(0, 4);
                const playlistTracks = playlist.tracks || playlist.songs || [];
                return (
                  <div
                    key={playlist.id}
                    className="w-[305px] sm:w-[325px] shrink-0 bg-[#161618] border border-white/10 rounded-[30px] p-5 shadow-2xl flex flex-col justify-between"
                  >
                    <div
                      onClick={() => handleOpenCommunityPlaylist(playlist)}
                      className="flex items-center gap-3.5 mb-4 cursor-pointer group/hdr hover:opacity-85 transition-opacity"
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden grid grid-cols-2 grid-rows-2 shrink-0 bg-neutral-900 border border-white/10 shadow-md group-hover/hdr:border-white/30 transition-all">
                        {covers.map((c, i) => (
                          <img
                            key={i}
                            src={c}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover/hdr:text-emerald-400 transition-colors">
                          {playlist.title}
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                          {playlist.trackCount || '100 lagu'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {playlistTracks.slice(0, 3).map((track, tIdx) => {
                        const isCur =
                          currentSong?.videoId === track.videoId || currentSong?.id === track.id;
                        return (
                          <div
                            key={track.id || track.videoId || tIdx}
                            onClick={() => playSong(track, playlistTracks)}
                            className={`flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${
                              isCur ? 'bg-white/10' : ''
                            }`}
                          >
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                              <img
                                src={track.image}
                                alt={track.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                              {isCur && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  {isPlaying ? (
                                    <div className="flex items-center gap-0.5">
                                      <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
                                      <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
                                    </div>
                                  ) : (
                                    <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5
                                className={`text-xs font-bold truncate ${
                                  isCur ? 'text-emerald-400' : 'text-white'
                                }`}
                              >
                                {track.title}
                              </h5>
                              <p className="text-[11px] text-white/50 truncate mt-0.5">
                                {track.artist}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          if (playlistTracks.length > 0) {
                            playSong(playlistTracks[0], playlistTracks);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-[#9DD4B4] hover:bg-[#8ec7a5] text-black flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all"
                        title="Putar Playlist"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (playlistTracks.length > 0) {
                            const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
                            playSong(shuffled[0], shuffled);
                            showToast(`Memutar Radio ${playlist.title}`);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border border-white/10 active:scale-95 transition-all"
                        title="Radio Playlist"
                      >
                        <Radio className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (playlistTracks.length > 0) {
                            playlistTracks.forEach((t) => addToQueue(t));
                            showToast(`${playlistTracks.length} lagu ditambahkan ke Antrean`);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border border-white/10 active:scale-95 transition-all"
                        title="Tambah ke Antrean"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. TETAP MENDENGARKAN (Circular Artist Cards) */}
        {sectionsData?.listeningArtists && sectionsData.listeningArtists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Tetap mendengarkan
              </h2>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-1">
              {(sectionsData.listeningArtists || []).map((artist, aIdx) => (
                <div
                  key={`${artist.name || artist.artistId || 'artist'}_${aIdx}`}
                  onClick={() =>
                    openArtist({
                      name: artist.name,
                      artistId: artist.artistId,
                      image: artist.image,
                    })
                  }
                  className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer w-24 sm:w-28 text-center"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-white/15 group-hover:border-white/40 transition-all bg-neutral-900 shadow-xl">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="w-full px-1">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 truncate block transition-colors">
                      {artist.name}
                    </span>
                    <span className="text-[10px] text-white/50 block mt-0.5">Artis</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. TRENDING NOW (10+ Songs) */}
        {sectionsData?.trendingNow && sectionsData.trendingNow.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Trending now
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
              {(sectionsData.trendingNow || []).map((song, i) =>
                renderHorizontalTrackCard(song, sectionsData.trendingNow || [], i)
              )}
            </div>
          </div>
        )}

        {/* 6. NEW RELEASES (10+ Songs) */}
        {sectionsData?.newReleases && sectionsData.newReleases.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                New Releases
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
              {(sectionsData.newReleases || []).map((song, i) =>
                renderHorizontalTrackCard(song, sectionsData.newReleases || [], i)
              )}
            </div>
          </div>
        )}

        {/* 8. MORE SERUPA DENGAN SECTIONS */}
        {sectionsData?.similarSections && sectionsData.similarSections.length > 0 && (
          <div className="space-y-8">
            {sectionsData.similarSections.map((sim, sIdx) => {
              const simArtist = sim.artist || { name: 'Artis', image: '' };
              const simTracks = sim.tracks || sim.songs || [];
              return (
                <div key={`${simArtist.name || 'sim'}_${sIdx}`}>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div
                      onClick={() => openArtist(simArtist)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0 bg-neutral-800 shadow-md">
                        <img
                          src={simArtist.image}
                          alt={simArtist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-white/50 font-medium block leading-none">
                          Serupa dengan
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight mt-0.5">
                          {simArtist.name}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => openArtist(simArtist)}
                      className="p-2 text-white/40 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      title={`Buka ${simArtist.name}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
                    {simTracks.map((song, i) => renderHorizontalTrackCard(song, simTracks, i))}
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* 13. VIRAL ON TIKTOK */}
        {sectionsData?.viralTikTok && sectionsData.viralTikTok.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Viral On Tiktok
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
              {(sectionsData.viralTikTok || []).map((song, i) =>
                renderHorizontalTrackCard(song, sectionsData.viralTikTok || [], i)
              )}
            </div>
          </div>
        )}

        {/* 14. FEEL-GOOD ROCK */}
        {sectionsData?.feelGoodRock && sectionsData.feelGoodRock.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Feel-good rock
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
              {(sectionsData.feelGoodRock || []).map((song, i) =>
                renderHorizontalTrackCard(song, sectionsData.feelGoodRock || [], i)
              )}
            </div>
          </div>
        )}

        {/* 15. ACOUSTIC CHILL */}
        {sectionsData?.acousticChill && sectionsData.acousticChill.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Acoustic Chill
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
              {(sectionsData.acousticChill || []).map((song, i) =>
                renderHorizontalTrackCard(song, sectionsData.acousticChill || [], i)
              )}
            </div>
          </div>
        )}

        {/* 16. FOR EID GETAWAYS */}
        {sectionsData?.eidGetaways && sectionsData.eidGetaways.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                For Eid Getaways
              </h2>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
              {(sectionsData.eidGetaways || []).map((song, i) =>
                renderHorizontalTrackCard(song, sectionsData.eidGetaways || [], i)
              )}
            </div>
          </div>
        )}

        {/* 17. SUASANA HATI DAN GENRE (Image 4 reference at the bottom of Home) */}
        {sectionsData?.suasanaHatiDanGenre && sectionsData.suasanaHatiDanGenre.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Suasana hati dan genre
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sectionsData.suasanaHatiDanGenre.map((genre) => (
                <div
                  key={genre.name}
                  onClick={() => openGenre(genre.name)}
                  style={{ backgroundColor: genre.color || '#2B4C5F' }}
                  className="h-16 sm:h-20 rounded-2xl p-4 flex items-center justify-between cursor-pointer border border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95 transition-all shadow-lg group"
                >
                  <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                    {genre.name}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/80 group-hover:text-white group-hover:bg-white/25 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
