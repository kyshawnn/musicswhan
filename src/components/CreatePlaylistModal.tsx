import React, { useState } from 'react';
import { X, Music } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ isOpen, onClose }) => {
  const { createPlaylist, setActivePlaylistId, setCurrentView } = useMusic();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newId = createPlaylist(name.trim(), description.trim());
    setActivePlaylistId(newId);
    setCurrentView('playlist');
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#18181A] border border-white/10 rounded-[36px] max-w-md w-full p-6 shadow-2xl space-y-5 text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Music className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold tracking-tight">Buat Playlist Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/70 block mb-1.5">
              Nama Playlist
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Lagu Favorit, Santai Malam..."
              className="w-full bg-[#242426] border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/70 block mb-1.5">
              Deskripsi (Opsional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat playlist..."
              className="w-full bg-[#242426] border border-white/10 focus:border-white/30 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-40"
            >
              Buat Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
