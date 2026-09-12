import React, { useState } from 'react';
import { X, Plus, Check, ListMusic } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const AddToPlaylistModal: React.FC = () => {
  const {
    trackToAddToPlaylist,
    setTrackToAddToPlaylist,
    playlists,
    addToPlaylist,
    createPlaylist,
  } = useMusic();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [addedPlaylistIds, setAddedPlaylistIds] = useState<string[]>([]);

  if (!trackToAddToPlaylist) return null;

  const handleSelectPlaylist = (playlistId: string) => {
    addToPlaylist(playlistId, trackToAddToPlaylist);
    setAddedPlaylistIds((prev) => [...prev, playlistId]);
    setTimeout(() => {
      setTrackToAddToPlaylist(null);
    }, 600);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newId = createPlaylist(newPlaylistName.trim());
    addToPlaylist(newId, trackToAddToPlaylist);
    setAddedPlaylistIds((prev) => [...prev, newId]);
    setTimeout(() => {
      setTrackToAddToPlaylist(null);
    }, 600);
  };

  return (
    <div
      id="add-to-playlist-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={() => setTrackToAddToPlaylist(null)}
    >
      <div
        id="add-to-playlist-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[#18181A] border-t sm:border border-white/10 rounded-t-[36px] sm:rounded-[36px] p-5 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white">Tambahkan ke Playlist</h3>
            <p className="text-xs text-white/50 truncate max-w-[260px] mt-0.5">
              {trackToAddToPlaylist.title || trackToAddToPlaylist.name}
            </p>
          </div>
          <button
            onClick={() => setTrackToAddToPlaylist(null)}
            className="p-2 text-white/40 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Playlists */}
        <div className="max-h-60 overflow-y-auto no-scrollbar py-3 space-y-1.5">
          {playlists.map((pl) => {
            const isAdded =
              addedPlaylistIds.includes(pl.id) ||
              pl.songs.some(
                (s) =>
                  s.id === trackToAddToPlaylist.id ||
                  (s.videoId && s.videoId === trackToAddToPlaylist.videoId)
              );

            return (
              <div
                key={pl.id}
                onClick={() => !isAdded && handleSelectPlaylist(pl.id)}
                className={`flex items-center justify-between p-3 rounded-2xl transition-colors cursor-pointer ${
                  isAdded ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/5 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-white/70">
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{pl.name}</h4>
                    <p className="text-xs text-white/40">{pl.songs.length} Lagu</p>
                  </div>
                </div>

                {isAdded ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-xs text-white/40 hover:text-white">+ Tambah</span>
                )}
              </div>
            );
          })}

          {playlists.length === 0 && !isCreatingNew && (
            <div className="text-center py-6 text-white/40 text-xs">
              Belum ada playlist. Buat playlist baru di bawah.
            </div>
          )}
        </div>

        {/* Create New Playlist Form or Button */}
        <div className="pt-2 border-t border-white/10">
          {!isCreatingNew ? (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Playlist Baru
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="space-y-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Nama playlist baru..."
                autoFocus
                className="w-full bg-[#242426] border border-white/10 focus:border-white/30 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 transition-all disabled:opacity-40"
                >
                  Simpan & Tambah
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
