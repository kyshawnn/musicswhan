import React, { useState, useRef } from 'react';
import {
  Heart,
  History,
  Plus,
  Music2,
  Trash2,
  Play,
  ListPlus,
  ChevronRight,
  TrendingUp,
  Download,
  Upload,
  Sparkles,
  User,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';

export const LibraryView: React.FC<{ onOpenCreatePlaylist: () => void }> = ({
  onOpenCreatePlaylist,
}) => {
  const {
    likedSongs,
    playlists,
    recentlyPlayed,
    downloadedSongs,
    setCurrentView,
    setActivePlaylistId,
    setIsHistoryOpen,
    deletePlaylist,
    playSong,
  } = useMusic();

  const [activeFilter, setActiveFilter] = useState<'Semua' | 'Playlist' | 'Suka' | 'Unduhan'>('Semua');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPlaylist = (id: string) => {
    setActivePlaylistId(id);
    setCurrentView('playlist');
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    const customSong: Song = {
      id: `local_${Date.now()}`,
      title: fileName,
      artist: 'File Lokal',
      album: 'Diunggah',
      duration: 180,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      audioUrl: url,
      source: 'local',
    };

    playSong(customSong);
  };

  return (
    <div id="library-view-container" className="pb-36 min-h-screen text-white select-none">
      {/* Hidden file input for Diunggah */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLocalFileUpload}
        accept="audio/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="sticky top-0 z-30 px-5 pt-4 pb-3 bg-[#0A0A0C]/85 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-white">
          Pustaka
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
            title="Profil / About"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenCreatePlaylist}
            className="p-2.5 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
            title="Buat Playlist Baru"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto space-y-6">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {(['Semua', 'Playlist', 'Suka', 'Unduhan'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                activeFilter === tab
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-[#18181A] text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TOP LIBRARY NAVIGATION CARDS (Gray Palette) */}
        {(activeFilter === 'Semua' || activeFilter === 'Suka' || activeFilter === 'Unduhan') && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1. Disukai */}
            <div
              onClick={() => {
                setActivePlaylistId(null);
                setCurrentView('liked');
              }}
              className="p-3.5 rounded-2xl bg-[#18181A] hover:bg-[#202024] border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-md flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 shrink-0 group-hover:scale-105 group-hover:text-white transition-all">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                  Disukai
                </h3>
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  {likedSongs.length} lagu
                </p>
              </div>
            </div>

            {/* 2. Diunduh */}
            <div
              onClick={() => {
                setActivePlaylistId(null);
                setCurrentView('downloaded');
              }}
              className="p-3.5 rounded-2xl bg-[#18181A] hover:bg-[#202024] border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-md flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 shrink-0 group-hover:scale-105 group-hover:text-white transition-all">
                <Download className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                  Diunduh
                </h3>
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  {downloadedSongs.length} lagu
                </p>
              </div>
            </div>

            {/* 3. Teratas Saya 50 */}
            <div
              onClick={() => {
                setActivePlaylistId(null);
                setCurrentView('top');
              }}
              className="p-3.5 rounded-2xl bg-[#18181A] hover:bg-[#202024] border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-md flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 shrink-0 group-hover:scale-105 group-hover:text-white transition-all">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                  Teratas Saya 50
                </h3>
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  Top 50 Hits
                </p>
              </div>
            </div>

            {/* 4. Riwayat Pemutaran */}
            <div
              onClick={() => setIsHistoryOpen(true)}
              className="p-3.5 rounded-2xl bg-[#18181A] hover:bg-[#202024] border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-md flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 shrink-0 group-hover:scale-105 group-hover:text-white transition-all">
                <History className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                  Riwayat
                </h3>
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  {recentlyPlayed.length} diputar
                </p>
              </div>
            </div>

            {/* 5. Diunggah (Lokal) */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-2xl bg-[#18181A] hover:bg-[#202024] border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-md flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 shrink-0 group-hover:scale-105 group-hover:text-white transition-all">
                <Upload className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                  Diunggah
                </h3>
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  File Audio Lokal
                </p>
              </div>
            </div>

            {/* 6. Buat playlist baru */}
            <div
              onClick={onOpenCreatePlaylist}
              className="p-3.5 rounded-2xl bg-[#18181A] hover:bg-[#202024] border border-dashed border-white/20 hover:border-white/40 transition-all cursor-pointer group shadow-md flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                  Buat playlist
                </h3>
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  Koleksi Baru
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PLAYLIST ANDA */}
        {(activeFilter === 'Semua' || activeFilter === 'Playlist') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Playlist Anda
              </h2>
              <button
                onClick={onOpenCreatePlaylist}
                className="text-xs font-semibold text-white/70 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Buat Baru
              </button>
            </div>

            {playlists.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl p-6 bg-white/[0.02]">
                <Music2 className="w-10 h-10 mx-auto text-white/20 mb-2" />
                <p className="text-sm font-semibold text-white">Belum ada playlist</p>
                <p className="text-xs text-white/40 mt-1 mb-4">
                  Buat playlist untuk menyusun kumpulan lagu favoritmu.
                </p>
                <button
                  onClick={onOpenCreatePlaylist}
                  className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:scale-105 transition-transform cursor-pointer"
                >
                  Buat Playlist
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => {
                  const firstTrack = playlist.songs[0];
                  const cover =
                    firstTrack?.image ||
                    (firstTrack?.videoId
                      ? `https://i.ytimg.com/vi/${firstTrack.videoId}/hqdefault.jpg`
                      : '');

                  return (
                    <div
                      key={playlist.id}
                      onClick={() => handleOpenPlaylist(playlist.id)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#18181A] hover:bg-[#202024] border border-white/5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                          {cover ? (
                            <img
                              src={cover}
                              alt={playlist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ListPlus className="w-6 h-6 text-white/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {playlist.name}
                          </h4>
                          <p className="text-xs text-white/50 truncate">
                            {playlist.songs.length} lagu
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {playlist.songs.length > 0 && (
                          <button
                            onClick={() => playSong(playlist.songs[0], playlist.songs)}
                            className="p-2 text-white/50 hover:text-white rounded-full transition-colors cursor-pointer"
                            title="Putar Playlist"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => deletePlaylist(playlist.id)}
                          className="p-2 text-white/30 hover:text-red-400 rounded-full transition-colors cursor-pointer"
                          title="Hapus Playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
