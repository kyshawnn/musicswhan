import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  Mic2,
  ListMusic,
  Maximize2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isBuffering,
    repeatMode,
    isShuffle,
    audioQuality,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    setAudioQuality,
    toggleLike,
    isLiked,
    isLyricsOpen,
    setIsLyricsOpen,
    isQueueOpen,
    setIsQueueOpen,
    queue,
  } = useMusic();

  const [isHoveredProgress, setIsHoveredProgress] = useState(false);

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;
  const isSongLiked = isLiked(currentSong.id);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <footer
      id="spotify-player-bar"
      className="fixed bottom-0 inset-x-0 h-20 sm:h-24 bg-[#181818] border-t border-zinc-800/80 px-3 sm:px-5 flex items-center justify-between z-50 select-none text-white shadow-2xl"
    >
      {/* 1. Left Section: Now Playing Metadata */}
      <div className="flex items-center space-x-3 w-[30%] sm:w-[28%] max-w-[320px] min-w-[150px] overflow-hidden">
        {/* Cover Art with hover expand icon */}
        <div
          onClick={() => setIsLyricsOpen(!isLyricsOpen)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-md overflow-hidden shrink-0 group cursor-pointer shadow-md bg-zinc-900 border border-zinc-800"
          title="Klik untuk lihat Lirik & Detail"
        >
          <img
            src={currentSong.image || (currentSong.videoId ? `https://i.ytimg.com/vi/${currentSong.videoId}/hqdefault.jpg` : '')}
            alt={currentSong.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center space-x-0.5 pointer-events-none">
              <span className="w-1 bg-[#1ED760] rounded-full animate-bar-1" />
              <span className="w-1 bg-[#1ED760] rounded-full animate-bar-2" />
              <span className="w-1 bg-[#1ED760] rounded-full animate-bar-3" />
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="overflow-hidden">
          <div className="text-xs sm:text-sm font-semibold truncate hover:underline cursor-pointer text-white">
            {currentSong.title}
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-400 truncate hover:underline hover:text-white cursor-pointer">
            {currentSong.artist}
          </div>
          {currentSong.quality320 && (
            <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-[#1ED760] border border-emerald-800/40 uppercase">
              Full Stream 320k
            </span>
          )}
        </div>

        {/* Like Heart Button */}
        <button
          id="player-like-btn"
          onClick={() => toggleLike(currentSong)}
          className={`p-1.5 rounded-full transition-all shrink-0 hover:scale-115 active:scale-90 ${
            isSongLiked ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
          }`}
          title={isSongLiked ? 'Hapus dari Lagu yang Disukai' : 'Simpan ke Lagu yang Disukai'}
        >
          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isSongLiked ? 'fill-[#1ED760]' : ''}`} />
        </button>
      </div>

      {/* 2. Middle Section: Playback Controls & Timeline */}
      <div className="flex flex-col items-center max-w-[45%] sm:max-w-[48%] w-full">
        {/* Buttons Row */}
        <div className="flex items-center space-x-3 sm:space-x-5 mb-1 sm:mb-1.5">
          {/* Shuffle Button */}
          <button
            id="player-shuffle-btn"
            onClick={toggleShuffle}
            className={`relative p-1 transition-colors ${
              isShuffle ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Acak: ${isShuffle ? 'Aktif' : 'Mati'}`}
          >
            <Shuffle className="w-4 h-4" />
            {isShuffle && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1ED760]" />}
          </button>

          {/* Previous Track */}
          <button
            id="player-prev-btn"
            onClick={playPrev}
            className="text-zinc-400 hover:text-white transition-colors hover:scale-110 active:scale-95"
            title="Lagu Sebelumnya"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            id="player-play-pause-btn"
            onClick={togglePlay}
            disabled={isBuffering}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg hover:bg-zinc-100"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isBuffering ? (
              <Loader2 className="w-5 h-5 text-black animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            id="player-next-btn"
            onClick={playNext}
            className="text-zinc-400 hover:text-white transition-colors hover:scale-110 active:scale-95"
            title="Lagu Berikutnya"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat Button */}
          <button
            id="player-repeat-btn"
            onClick={toggleRepeat}
            className={`relative p-1 transition-colors ${
              repeatMode !== 'off' ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Ulangi: ${repeatMode === 'one' ? 'Satu Lagu' : repeatMode === 'all' ? 'Semua' : 'Mati'}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            {repeatMode !== 'off' && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1ED760]" />
            )}
          </button>
        </div>

        {/* Seek Bar Row */}
        <div className="w-full flex items-center space-x-2 sm:space-x-3 text-[11px] font-medium text-zinc-400">
          <span className="min-w-[32px] text-right font-mono">{formatTime(currentTime)}</span>
          <div
            className="relative flex-1 flex items-center group py-2"
            onMouseEnter={() => setIsHoveredProgress(true)}
            onMouseLeave={() => setIsHoveredProgress(false)}
          >
            {/* Background Track */}
            <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
              {/* Active Fill */}
              <div
                className={`h-full transition-colors ${isHoveredProgress ? 'bg-[#1ED760]' : 'bg-white'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Invisible native range slider over track for touch/click precision */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.5"
              value={currentTime}
              onChange={handleSeekChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="min-w-[32px] font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. Right Section: Volume & Utilities */}
      <div className="flex items-center justify-end space-x-2 sm:space-x-3 w-[26%] sm:w-[24%]">
        {/* Lyrics Button */}
        <button
          id="toggle-lyrics-btn"
          onClick={() => setIsLyricsOpen(!isLyricsOpen)}
          className={`p-1.5 rounded-full transition-colors hover:scale-110 active:scale-95 ${
            isLyricsOpen ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
          }`}
          title="Lirik Lagu"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        {/* Queue Button */}
        <button
          id="toggle-queue-btn"
          onClick={() => setIsQueueOpen(!isQueueOpen)}
          className={`relative p-1.5 rounded-full transition-colors hover:scale-110 active:scale-95 ${
            isQueueOpen ? 'text-[#1ED760]' : 'text-zinc-400 hover:text-white'
          }`}
          title="Antrean Lagu"
        >
          <ListMusic className="w-4 h-4" />
          {queue.length > 1 && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#1ED760] text-black text-[9px] font-extrabold flex items-center justify-center">
              {queue.length - 1}
            </span>
          )}
        </button>

        {/* Audio Quality Switcher */}
        <button
          onClick={() => setAudioQuality(audioQuality === '320' ? '160' : '320')}
          className="hidden md:flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
          title="Kualitas Audio Stream"
        >
          <Sparkles className="w-2.5 h-2.5 text-[#1ED760]" />
          <span>{audioQuality === '320' ? 'HD 320k' : 'SD 160k'}</span>
        </button>

        {/* Volume Controls */}
        <div className="hidden sm:flex items-center space-x-2 w-24 sm:w-28 group">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Bunyikan' : 'Senyapkan'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="relative flex-1 flex items-center py-2">
            <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-[#1ED760] transition-colors"
                style={{ width: `${volumePercent}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Fullscreen Lyrics Toggle */}
        <button
          onClick={() => setIsLyricsOpen(!isLyricsOpen)}
          className="hidden lg:block text-zinc-400 hover:text-white transition-colors p-1"
          title="Layar Penuh"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
