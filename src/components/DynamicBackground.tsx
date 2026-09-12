import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMusic } from '../context/MusicContext';

// Moody dark palettes for dynamic ambient background
const MOODY_PALETTES = [
  { prim: 'rgba(30, 75, 140, 0.45)', sec: 'rgba(70, 30, 110, 0.35)', tert: 'rgba(15, 30, 60, 0.5)' },
  { prim: 'rgba(20, 110, 80, 0.45)', sec: 'rgba(15, 60, 90, 0.35)', tert: 'rgba(10, 40, 35, 0.5)' },
  { prim: 'rgba(120, 40, 80, 0.45)', sec: 'rgba(60, 20, 90, 0.35)', tert: 'rgba(40, 15, 45, 0.5)' },
  { prim: 'rgba(140, 70, 20, 0.45)', sec: 'rgba(100, 30, 50, 0.35)', tert: 'rgba(45, 25, 15, 0.5)' },
  { prim: 'rgba(35, 90, 130, 0.45)', sec: 'rgba(25, 120, 110, 0.35)', tert: 'rgba(15, 35, 55, 0.5)' },
  { prim: 'rgba(90, 35, 130, 0.45)', sec: 'rgba(40, 40, 100, 0.35)', tert: 'rgba(30, 15, 50, 0.5)' },
  { prim: 'rgba(130, 30, 45, 0.45)', sec: 'rgba(80, 20, 60, 0.35)', tert: 'rgba(45, 10, 20, 0.5)' },
  { prim: 'rgba(25, 95, 105, 0.45)', sec: 'rgba(20, 50, 90, 0.35)', tert: 'rgba(10, 35, 40, 0.5)' },
];

export const DynamicBackground: React.FC = () => {
  const { currentSong } = useMusic();

  const imageUrl =
    currentSong?.image ||
    (currentSong?.videoId
      ? `https://i.ytimg.com/vi/${currentSong.videoId}/hqdefault.jpg`
      : '');

  // Generate rich moody theme based on current song or artist
  const palette = useMemo(() => {
    if (!currentSong) {
      return {
        prim: 'rgba(35, 45, 75, 0.4)',
        sec: 'rgba(25, 30, 55, 0.3)',
        tert: 'rgba(15, 18, 30, 0.5)',
      };
    }
    const str = `${currentSong.title || ''}_${currentSong.artist || ''}_${currentSong.id || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % MOODY_PALETTES.length;
    return MOODY_PALETTES[index];
  }, [currentSong?.id, currentSong?.title, currentSong?.artist]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#0A0A0C]"
    >
      {/* Dynamic Album Art Layer with Cross-fade and Ultra Blur */}
      <AnimatePresence mode="popLayout">
        {imageUrl ? (
          <motion.div
            key={imageUrl}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.48, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute -inset-16"
          >
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover blur-[75px] saturate-200 brightness-80"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Dynamic Ambient Color Orbs */}
      <div
        className="absolute -top-32 -left-20 w-[600px] h-[600px] rounded-full blur-[140px] transition-colors duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle, ${palette.prim} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-1/4 -right-24 w-[550px] h-[550px] rounded-full blur-[150px] transition-colors duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle, ${palette.sec} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -bottom-24 left-1/3 w-[650px] h-[550px] rounded-full blur-[160px] transition-colors duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle, ${palette.tert} 0%, transparent 75%)`,
        }}
      />

      {/* Dark Translucent Vignette - Keeps contrast pristine and strictly dark */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0C]/40 via-[#0A0A0C]/70 to-[#0A0A0C]/95" />
      <div className="absolute inset-0 bg-[#0A0A0C]/25 backdrop-blur-[24px]" />
    </div>
  );
};
