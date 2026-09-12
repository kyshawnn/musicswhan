import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { BottomNav } from './components/BottomNav';
import { Player } from './components/Player';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { LibraryView } from './components/LibraryView';
import { LikedSongsView } from './components/LikedSongsView';
import { PlaylistView } from './components/PlaylistView';
import { ArtistView } from './components/ArtistView';
import { TopIndonesiaView } from './components/TopIndonesiaView';
import { DevView } from './components/DevView';
import { GenreView } from './components/GenreView';
import { DownloadedView } from './components/DownloadedView';
import { HistoryModal } from './components/HistoryModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { DynamicBackground } from './components/DynamicBackground';

const MainApp: React.FC = () => {
  const { currentView, activePlaylistId } = useMusic();
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);

  const renderCurrentView = () => {
    if (activePlaylistId) {
      return <PlaylistView />;
    }

    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'top':
        return <TopIndonesiaView />;
      case 'genre':
        return <GenreView />;
      case 'downloaded':
        return <DownloadedView />;
      case 'library':
        return <LibraryView onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)} />;
      case 'liked':
        return <LikedSongsView />;
      case 'playlist':
        return <PlaylistView />;
      case 'artist':
        return <ArtistView />;
      case 'developer':
        return <DevView />;
      default:
        return <HomeView />;
    }
  };

  const currentKey = activePlaylistId ? `playlist_${activePlaylistId}` : currentView;

  return (
    <div className="h-full w-full bg-[#0A0A0C] text-white flex flex-col font-sans antialiased relative selection:bg-white/20 overflow-hidden">
      {/* Dynamic Album Art / Dominant Color Dark Blur Background */}
      <DynamicBackground />

      {/* Main Content Area - Full vertical scrolling with smooth page transitions */}
      <main
        id="main-content-scroll"
        className="flex-1 w-full overflow-y-auto overflow-x-hidden touch-pan-y overscroll-y-contain"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full min-h-full"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Mini Player & Full-Screen Player Modal */}
      <Player />

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav />

      {/* Modal Dialogs */}
      <HistoryModal />
      <AddToPlaylistModal />
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainApp />
    </MusicProvider>
  );
}
