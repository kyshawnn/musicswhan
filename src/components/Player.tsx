import React, { useState, useEffect, useRef, useMemo } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ChevronDown,
  ListMusic,
  Mic2,
  Disc,
  MoreVertical,
  PlusCircle,
  Share2,
  Check,
  X,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { parseSyncedLyrics } from './LyricsModal';

export const Player: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    isShuffle,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    toggleRepeat,
    toggleShuffle,
    isLiked,
    toggleLike,
    registerYtPlayer,
    handleYtStateChange,
    upNextTracks,
    playSong,
    lyricsData,
    isLoadingLyrics,
    isPlayerExpanded,
    setIsPlayerExpanded,
    isMiniPlayerDismissed,
    setIsMiniPlayerDismissed,
    setTrackToAddToPlaylist,
    openArtist,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'track' | 'lyrics' | 'upnext'>('track');
  const [copied, setCopied] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  const syncedLines = useMemo(() => {
    if (!lyricsData?.syncedLyrics) return [];
    return parseSyncedLyrics(lyricsData.syncedLyrics);
  }, [lyricsData?.syncedLyrics]);

  const activeLyricsLineIndex = useMemo(() => {
    if (syncedLines.length > 0) {
      let idx = -1;
      for (let i = 0; i < syncedLines.length; i++) {
        // Precise vocal match (-0.05s optical threshold)
        if (currentTime >= syncedLines[i].time - 0.05) {
          idx = i;
        } else {
          break;
        }
      }
      return idx;
    }
    return -1;
  }, [currentTime, syncedLines]);

  // Auto scroll active lyric in full player lyrics tab
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricsLineIndex, activeTab]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    registerYtPlayer(event.target);
    if (isPlaying && currentSong?.videoId) {
      try {
        event.target.playVideo();
      } catch {
        // ignore
      }
    }
  };

  const onPlayerError: YouTubeProps['onError'] = (event) => {
    console.warn('YouTube Player error code:', event.data);
    setTimeout(() => {
      playNext();
    }, 1500);
  };

  const handleShare = () => {
    if (currentSong) {
      const url = currentSong.videoId
        ? `https://youtu.be/${currentSong.videoId}`
        : window.location.href;
      navigator.clipboard?.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (!currentSong) return null;

  const liked = isLiked(currentSong.videoId || currentSong.id);
  const songImage =
    currentSong.image ||
    currentSong.thumbnails?.[0]?.url ||
    (currentSong.videoId ? `https://i.ytimg.com/vi/${currentSong.videoId}/hqdefault.jpg` : '');

  return (
    <>
      {/* Hidden YouTube Audio Engine */}
      <div className="fixed top-0 left-0 w-px h-px opacity-0 pointer-events-none overflow-hidden z-[-1]">
        {currentSong.videoId && (
          <YouTube
            videoId={currentSong.videoId}
            opts={{
              height: '1',
              width: '1',
              playerVars: {
                autoplay: isPlaying ? 1 : 0,
                controls: 0,
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
              },
            }}
            onReady={onPlayerReady}
            onStateChange={handleYtStateChange}
            onError={onPlayerError}
          />
        )}
      </div>

      {/* 1. FLOATING MINI PLAYER (Docked above BottomNav, radius 40px, isolated events) */}
      {!isPlayerExpanded && !isMiniPlayerDismissed && (
        <div
          id="mini-player-bar"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsPlayerExpanded(true);
          }}
          className="fixed bottom-[74px] left-3.5 right-3.5 z-40 max-w-lg mx-auto bg-[#18181A]/95 backdrop-blur-2xl rounded-full p-2 pl-2.5 pr-2.5 flex items-center justify-between border border-white/10 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.85)] transition-all duration-200 select-none pointer-events-auto"
        >
          {/* Track Info (Left) */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            {/* Circular Cover Art */}
            <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/15 bg-neutral-900 shadow-md">
              <img
                src={songImage}
                alt={currentSong.title || currentSong.name}
                className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                loading="eager"
              />
            </div>

            {/* Title & Artist */}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                {currentSong.title || currentSong.name}
              </h4>
              <p
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (currentSong?.artist) {
                    openArtist({ name: currentSong.artist });
                  }
                }}
                className="text-[11px] sm:text-xs text-white/50 hover:text-white hover:underline truncate mt-0.5 cursor-pointer inline-block"
              >
                {currentSong.artist || currentSong.artists}
              </p>
            </div>
          </div>

          {/* Quick Controls (Right) */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Play/Pause Button */}
            <button
              id="mini-play-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePlay();
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Heart Button */}
            <button
              id="mini-like-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleLike(currentSong);
              }}
              className={`w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                liked ? 'text-red-500' : 'text-white/60 hover:text-white'
              }`}
              title={liked ? 'Hapus Suka' : 'Sukai'}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </button>

            {/* Next Track Button */}
            <button
              id="mini-next-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                playNext();
              }}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Berikutnya"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Close / Dismiss mini player button */}
            <button
              id="mini-dismiss-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMiniPlayerDismissed(true);
              }}
              className="w-7 h-7 rounded-full text-white/40 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-0.5"
              title="Sembunyikan Pemutar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Micro Progress Bar along bottom */}
          <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. FULL-SCREEN EXPANDED PLAYER POPUP (iPhone Clean modal with close button) */}
      {isPlayerExpanded && (
        <div
          id="full-screen-player-modal"
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-[#0A0A0C] flex flex-col justify-between p-5 sm:p-6 overflow-y-auto no-scrollbar pointer-events-auto animate-in fade-in slide-in-from-bottom-6 duration-200"
        >
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between relative z-10 max-w-md mx-auto w-full">
            <button
              id="close-expanded-player-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPlayerExpanded(false);
              }}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Tutup Popup"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Memutar Sekarang
              </span>
              <p className="text-xs font-semibold text-white/80 truncate max-w-[180px]">
                {currentSong.album || 'Top Hits'}
              </p>
            </div>

            <div className="relative">
              <button
                id="expanded-options-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(!showOptionsMenu);
                }}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-12 w-48 bg-[#1C1C1E] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setTrackToAddToPlaylist(currentSong);
                      setShowOptionsMenu(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-white/70" />
                    Tambah ke Playlist
                  </button>
                  <button
                    onClick={() => {
                      handleShare();
                      setShowOptionsMenu(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white/70" />}
                    {copied ? 'Tautan Disalin' : 'Bagikan'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subtabs: Lagu | Lirik | Berikutnya */}
          <div className="flex items-center justify-center gap-2 my-4 relative z-10 max-w-md mx-auto w-full">
            <button
              onClick={() => setActiveTab('track')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5" />
                Lagu
              </span>
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'lyrics'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5" />
                Lirik
              </span>
            </button>
            <button
              onClick={() => setActiveTab('upnext')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'upnext'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5" />
                Berikutnya ({upNextTracks.length})
              </span>
            </button>
          </div>

          {/* TAB 1: TRACK VIEW (Artwork, Scrub Bar, Controls) */}
          {activeTab === 'track' && (
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-4 relative z-10">
              {/* Square Artwork with 36px radius */}
              <div className="relative aspect-square w-full rounded-[36px] overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 mb-7">
                <img
                  src={songImage}
                  alt={currentSong.title || currentSong.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Artist & Like */}
              <div className="flex items-center justify-between mb-5">
                <div className="min-w-0 flex-1 pr-4">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate leading-tight">
                    {currentSong.title || currentSong.name}
                  </h2>
                  <p
                    onClick={() => {
                      if (currentSong?.artist) {
                        setIsPlayerExpanded(false);
                        openArtist({ name: currentSong.artist });
                      }
                    }}
                    className="text-xs sm:text-sm text-white/60 hover:text-white hover:underline font-medium truncate mt-1 cursor-pointer inline-block"
                  >
                    {currentSong.artist || currentSong.artists}
                  </p>
                </div>

                <button
                  id="expanded-like-btn"
                  onClick={() => toggleLike(currentSong)}
                  className={`p-3 rounded-full transition-transform active:scale-90 cursor-pointer ${
                    liked ? 'text-red-500' : 'text-white/50 hover:text-white'
                  }`}
                  title={liked ? 'Hapus Suka' : 'Sukai'}
                >
                  <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Timeline Slider with Clean White Trail & Thumb (No Neon) */}
              <div className="mb-5">
                <div className="relative w-full h-7 flex items-center group cursor-pointer select-none">
                  {/* Background Track */}
                  <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full overflow-hidden">
                    {/* White Progress Trail behind the circle */}
                    <div
                      className="h-full bg-white rounded-full transition-all duration-75"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Moving Round Thumb (Clean White, No Neon Glow) */}
                  <div
                    className="absolute w-3.5 h-3.5 bg-white rounded-full -translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform"
                    style={{ left: `${progressPercent}%` }}
                  />

                  {/* Interactive Range Input */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-white/40 -mt-0.5 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls Row */}
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 transition-colors cursor-pointer ${
                    isShuffle ? 'text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title="Acak"
                >
                  <Shuffle className="w-5 h-5" />
                </button>

                <button
                  onClick={playPrev}
                  className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Sebelumnya"
                >
                  <SkipBack className="w-7 h-7" />
                </button>

                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title={isPlaying ? 'Jeda' : 'Putar'}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={playNext}
                  className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Berikutnya"
                >
                  <SkipForward className="w-7 h-7" />
                </button>

                <button
                  onClick={toggleRepeat}
                  className={`p-2 transition-colors cursor-pointer ${
                    repeatMode !== 'off' ? 'text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title="Ulangi"
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-5 h-5 text-white" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LYRICS VIEW */}
          {activeTab === 'lyrics' && (
            <div
              ref={lyricsContainerRef}
              className="flex-1 overflow-y-auto max-w-md mx-auto w-full py-8 px-6 space-y-6 no-scrollbar scroll-smooth"
            >
              {isLoadingLyrics ? (
                <div className="flex justify-center py-20 text-white/50 text-xs">
                  Memuat lirik...
                </div>
              ) : syncedLines.length > 0 ? (
                /* Apple Music clean lyrics */
                <div className="space-y-6 pb-32 pt-2">
                  {syncedLines.map((line, idx) => {
                    const isActive = idx === activeLyricsLineIndex;
                    const isPast = idx < activeLyricsLineIndex;
                    return (
                      <p
                        key={idx}
                        ref={isActive ? activeLyricRef : null}
                        onClick={() => seekTo(line.time)}
                        className={`cursor-pointer select-none leading-relaxed transition-all duration-300 font-bold text-xl sm:text-2xl tracking-tight ${
                          isActive
                            ? 'text-white font-extrabold scale-[1.03] origin-left opacity-100'
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
              ) : lyricsData?.lines && lyricsData.lines.length > 0 ? (
                /* Static lyrics fallback */
                <div className="space-y-4 py-4 text-left">
                  <span className="text-[11px] uppercase font-bold text-white/40 tracking-wider block mb-2">
                    Teks Lirik
                  </span>
                  {lyricsData.lines.map((line, idx) => (
                    <p key={idx} className="text-base sm:text-lg font-semibold text-white/70 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-white/40 text-sm">
                  Lirik tidak tersedia untuk lagu ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UP NEXT QUEUE */}
          {activeTab === 'upnext' && (
            <div className="flex-1 overflow-y-auto max-w-md mx-auto w-full py-4 space-y-2 no-scrollbar">
              {upNextTracks.length === 0 ? (
                <div className="text-center py-20 text-white/40 text-xs">
                  Tidak ada lagu berikutnya di antrean.
                </div>
              ) : (
                upNextTracks.map((trk, i) => (
                  <div
                    key={trk.videoId || i}
                    onClick={() => playSong(trk, upNextTracks)}
                    className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                      <img
                        src={
                          trk.image ||
                          `https://i.ytimg.com/vi/${trk.videoId}/hqdefault.jpg`
                        }
                        alt={trk.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs sm:text-sm font-semibold text-white truncate">
                        {trk.title}
                      </h5>
                      <p className="text-[11px] text-white/50 truncate">
                        {trk.artist}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Bottom Bar: Dismiss Modal Trigger */}
          <div className="text-center py-2 relative z-10 max-w-md mx-auto w-full">
            <button
              onClick={() => setIsPlayerExpanded(false)}
              className="text-xs text-white/40 hover:text-white transition-colors font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};
