import React from 'react';
import { Home, Search, Flame, Library, User } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { ViewMode } from '../types';

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView, setActivePlaylistId } = useMusic();

  const tabs: { name: string; view: ViewMode; icon: React.ElementType }[] = [
    { name: 'Beranda', view: 'home', icon: Home },
    { name: 'Mencari', view: 'search', icon: Search },
    { name: 'Top 50', view: 'top', icon: Flame },
    { name: 'Pustaka', view: 'library', icon: Library },
    { name: 'Dev', view: 'developer', icon: User },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0C]/90 backdrop-blur-xl border-t border-white/5 pb-safe select-none pointer-events-auto"
    >
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = currentView === tab.view;
          const Icon = tab.icon;

          return (
            <button
              key={tab.name}
              id={`nav-btn-${tab.view}`}
              onClick={() => {
                setActivePlaylistId(null);
                setCurrentView(tab.view);
              }}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors cursor-pointer ${
                isActive ? 'text-white' : 'text-white/45 hover:text-white/80'
              }`}
            >
              <div
                className={`px-3 sm:px-4 py-1 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-white text-black shadow-sm' : 'bg-transparent text-white/50'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[10px] tracking-tight ${
                  isActive ? 'font-bold text-white' : 'font-medium text-white/50'
                }`}
              >
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
