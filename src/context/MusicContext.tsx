import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Song, Playlist, RepeatMode, AudioQuality, ViewMode, LyricsData, ArtistInfo } from '../types';
import { INITIAL_POPULAR_SONGS, FEATURED_PLAYLISTS } from '../data/defaultData';

interface MusicContextType {
  // Audio state
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isBuffering: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  audioQuality: AudioQuality;

  // Controls
  playSong: (song: Song, contextQueue?: Song[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setAudioQuality: (quality: AudioQuality) => void;

  // YouTube player registration
  registerYtPlayer: (player: any) => void;
  handleYtStateChange: (event: any) => void;
  ytPlayerRef: React.MutableRefObject<any>;

  // Queue
  queue: Song[];
  queueIndex: number;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;

  // Up Next recommendations from YouTube Music
  upNextTracks: Song[];
  isLoadingUpNext: boolean;

  // Liked Songs
  likedSongs: Song[];
  toggleLike: (song: Song) => void;
  isLiked: (songOrId: Song | string) => boolean;

  // Custom User Playlists
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => string;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  deletePlaylist: (playlistId: string) => void;

  // Navigation / Views
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string | null) => void;
  selectedPlaylistData: Playlist | null;
  setSelectedPlaylistData: (pl: Playlist | null) => void;
  openPlaylist: (playlist: Playlist) => void;
  selectedArtist: ArtistInfo | null;
  setSelectedArtist: (artist: ArtistInfo | null) => void;
  openArtist: (artist: ArtistInfo) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Mood filter on Beranda
  activeMood: string | null;
  setActiveMood: (mood: string | null) => void;

  // Full-screen Player expanded view & mini player dismissal
  isPlayerExpanded: boolean;
  setIsPlayerExpanded: (expanded: boolean) => void;
  isMiniPlayerDismissed: boolean;
  setIsMiniPlayerDismissed: (dismissed: boolean) => void;

  // Lyrics
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  lyricsData: LyricsData | null;
  isLoadingLyrics: boolean;

  // Recently Played
  recentlyPlayed: Song[];
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  clearHistory: () => void;

  // Subscribed Artists
  subscribedArtists: ArtistInfo[];
  toggleSubscribeArtist: (artist: ArtistInfo) => void;
  isArtistSubscribed: (artistNameOrId: string) => boolean;
  unsubscribeArtist: (artistNameOrId: string) => void;

  // Add to Playlist modal
  trackToAddToPlaylist: Song | null;
  setTrackToAddToPlaylist: (song: Song | null) => void;

  // Genre & Mood Navigation
  selectedGenre: string | null;
  setSelectedGenre: (genre: string | null) => void;
  openGenre: (genre: string) => void;

  // Downloaded / Offline songs
  downloadedSongs: Song[];
  toggleDownloadSong: (song: Song) => void;
  isDownloaded: (songId: string) => boolean;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const LIKED_KEY = 'spotify_clone_liked_songs';
const DOWNLOADED_KEY = 'spotify_clone_downloaded_songs';
const PLAYLISTS_KEY = 'spotify_clone_user_playlists';
const RECENT_KEY = 'spotify_clone_recently_played';
const SUBS_KEY = 'subscribed_artists';

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Audio element ref and YouTube player ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);

  // Playback state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [audioQuality, setAudioQualityState] = useState<AudioQuality>('320');

  // Up Next recommendations from YouTube Music
  const [upNextTracks, setUpNextTracks] = useState<Song[]>([]);
  const [isLoadingUpNext, setIsLoadingUpNext] = useState<boolean>(false);

  // Mood filter on Beranda
  const [activeMood, setActiveMood] = useState<string | null>(null);

  // Full-screen Player expanded view
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState<boolean>(false);

  // Add to Playlist modal
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState<Song | null>(null);

  // History modal
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Queue state
  const [queue, setQueue] = useState<Song[]>(INITIAL_POPULAR_SONGS);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Liked songs state
  const [likedSongs, setLikedSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(LIKED_KEY);
      return saved ? JSON.parse(saved) : [INITIAL_POPULAR_SONGS[0], INITIAL_POPULAR_SONGS[2]];
    } catch {
      return [];
    }
  });

  // User playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(PLAYLISTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Subscribed artists state
  const [subscribedArtists, setSubscribedArtists] = useState<ArtistInfo[]>(() => {
    try {
      const saved = localStorage.getItem(SUBS_KEY);
      if (!saved) {
        return [
          {
            name: 'Tulus',
            artistId: 'UCe5j7n2L49g5r4zYk8w1_1Q',
            image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
            subscribers: '4.8M',
          },
          {
            name: 'Hindia',
            artistId: 'UC6y5e7N9_1h8a9x7k2b3c4d',
            image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
            subscribers: '2.1M',
          },
        ];
      }
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => {
          if (typeof item === 'string') {
            return {
              name: item,
              image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
            };
          }
          return item;
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SUBS_KEY, JSON.stringify(subscribedArtists));
    } catch {}
  }, [subscribedArtists]);

  const isArtistSubscribed = (artistNameOrId: string): boolean => {
    if (!artistNameOrId) return false;
    const target = artistNameOrId.trim().toLowerCase();
    return subscribedArtists.some(
      (a) =>
        a.name.toLowerCase() === target ||
        (a.artistId && a.artistId.toLowerCase() === target) ||
        (a.id && a.id.toLowerCase() === target)
    );
  };

  const toggleSubscribeArtist = (artist: ArtistInfo) => {
    if (!artist || !artist.name) return;
    setSubscribedArtists((prev) => {
      const exists = prev.some(
        (a) =>
          a.name.toLowerCase() === artist.name.toLowerCase() ||
          (artist.artistId && a.artistId === artist.artistId)
      );
      if (exists) {
        return prev.filter(
          (a) =>
            a.name.toLowerCase() !== artist.name.toLowerCase() &&
            (!artist.artistId || a.artistId !== artist.artistId)
        );
      } else {
        const newEntry: ArtistInfo = {
          name: artist.name,
          artistId: artist.artistId,
          image:
            artist.image ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
          subscribers: artist.subscribers || 'Artis',
          description: artist.description,
        };
        return [newEntry, ...prev];
      }
    });
  };

  const unsubscribeArtist = (artistNameOrId: string) => {
    if (!artistNameOrId) return;
    const target = artistNameOrId.trim().toLowerCase();
    setSubscribedArtists((prev) =>
      prev.filter(
        (a) =>
          a.name.toLowerCase() !== target &&
          (!a.artistId || a.artistId.toLowerCase() !== target)
      )
    );
  };

  // Recently played
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : INITIAL_POPULAR_SONGS.slice(0, 4);
    } catch {
      return [];
    }
  });

  // View state
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [selectedPlaylistData, setSelectedPlaylistData] = useState<Playlist | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<ArtistInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const openArtist = (artist: ArtistInfo) => {
    setSelectedArtist(artist);
    setActivePlaylistId(null);
    setCurrentView('artist');
  };

  const openPlaylist = (playlist: Playlist) => {
    setSelectedPlaylistData(playlist);
    setActivePlaylistId(playlist.id);
    setCurrentView('playlist');
  };

  // Lyrics state
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(false);

  // Register YouTube player
  const registerYtPlayer = (player: any) => {
    ytPlayerRef.current = player;
    try {
      if (player && typeof player.setVolume === 'function') {
        player.setVolume(volume * 100);
      }
    } catch {
      // ignore
    }
  };

  const handleYtStateChange = (event: any) => {
    // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
    const state = event.data;
    if (state === 1) {
      // playing
      setIsPlaying(true);
      setIsBuffering(false);
      try {
        const d = event.target.getDuration();
        if (d && d > 0) setDuration(d);
      } catch {
        // ignore
      }
    } else if (state === 2) {
      // paused
      setIsPlaying(false);
      setIsBuffering(false);
    } else if (state === 3) {
      // buffering
      setIsBuffering(true);
    } else if (state === 0) {
      // ended
      if (repeatMode === 'one') {
        try {
          event.target.seekTo(0, true);
          event.target.playVideo();
        } catch {
          playNext();
        }
      } else {
        playNext();
      }
    }
  };

  // Poll current time with high precision (100ms) for real-time lyric vocal tracking
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (currentSong?.videoId && ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const time = ytPlayerRef.current.getCurrentTime();
            if (typeof time === 'number' && !isNaN(time)) {
              setCurrentTime(time);
            }
          }
          if (typeof ytPlayerRef.current.getDuration === 'function') {
            const d = ytPlayerRef.current.getDuration();
            if (typeof d === 'number' && d > 0) {
              setDuration(d);
            }
          }
        } catch {
          // ignore
        }
      } else if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
        if (audioRef.current.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration !== Infinity) {
          setDuration(audioRef.current.duration);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentSong?.videoId]);

  // Initialize Audio for non-YouTube streams
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (!currentSong?.videoId) {
        setCurrentTime(audio.currentTime);
        if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
          setDuration(audio.duration);
        }
      }
    };

    const handleWaiting = () => {
      if (!currentSong?.videoId) setIsBuffering(true);
    };
    const handlePlaying = () => {
      if (!currentSong?.videoId) {
        setIsBuffering(false);
        setIsPlaying(true);
      }
    };
    const handlePause = () => {
      if (!currentSong?.videoId) setIsPlaying(false);
    };

    const handleLoadedMetadata = () => {
      if (!currentSong?.videoId) {
        if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
          setDuration(audio.duration);
        }
        setIsBuffering(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
      audio.src = '';
    };
  }, [currentSong?.videoId]);

  // Handle song ending for HTML5 audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (!currentSong?.videoId) {
        if (repeatMode === 'one') {
          audio.currentTime = 0;
          audio.play().catch(console.error);
        } else {
          playNext();
        }
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [repeatMode, queue, queueIndex, isShuffle, currentSong?.videoId]);

  // Sync MediaSession API for mobile lockscreen & background audio
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title || currentSong.name || 'Musik',
        artist: currentSong.artist || currentSong.artists || 'Artis',
        album: currentSong.album || 'Aura Musik',
        artwork: [
          { src: currentSong.image || '', sizes: '512x512', type: 'image/jpeg' },
          { src: currentSong.image || '', sizes: '192x192', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => resumeSong());
      navigator.mediaSession.setActionHandler('pause', () => pauseSong());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seekTo(details.seekTime);
        }
      });
    } catch {
      // ignore mediaSession errors
    }

    return () => {
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('seekto', null);
        } catch {
          // ignore
        }
      }
    };
  }, [currentSong, isPlaying]);

  // Keep MediaSession position state in sync
  useEffect(() => {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession) || !currentSong || !duration) return;
    try {
      if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, duration),
          playbackRate: 1,
          position: Math.min(currentTime, duration),
        });
      }
    } catch {
      // ignore
    }
  }, [currentTime, duration, currentSong]);

  // Background Audio Keeper for mobile / lockscreen YouTube playback
  useEffect(() => {
    if (!isPlaying) return;

    // Silent 1-second WAV data URI to keep browser audio thread alive in background on mobile
    const silentAudio = new Audio(
      'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
    );
    silentAudio.loop = true;
    silentAudio.volume = 0.01;

    const startSilent = () => {
      silentAudio.play().catch(() => {});
    };

    startSilent();

    return () => {
      silentAudio.pause();
      silentAudio.src = '';
    };
  }, [isPlaying]);

  // Fetch Up Next whenever currentSong changes with videoId
  useEffect(() => {
    if (!currentSong?.videoId) {
      setUpNextTracks([]);
      return;
    }

    setIsLoadingUpNext(true);
    fetch(`/api/upnext?id=${encodeURIComponent(currentSong.videoId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const parsed: Song[] = data.map((item: any) => ({
            id: `yt_${item.videoId}`,
            videoId: item.videoId,
            title: item.title || item.name || 'Lagu',
            name: item.title || item.name || 'Lagu',
            artist: item.artists || item.artist?.name || 'Artis',
            artists: item.artists || item.artist?.name || 'Artis',
            album: item.album?.name || 'YouTube Music',
            duration: typeof item.duration === 'string' ? parseDurationString(item.duration) : item.duration || 200,
            image:
              item.thumbnail ||
              item.thumbnails?.[item.thumbnails.length - 1]?.url ||
              item.thumbnails?.[0]?.url ||
              (item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` : 'https://i.ytimg.com/vi/D47mUu1b_54/hqdefault.jpg'),
            source: 'youtube',
          }));
          setUpNextTracks(parsed);
        }
      })
      .catch(() => setUpNextTracks([]))
      .finally(() => setIsLoadingUpNext(false));
  }, [currentSong?.videoId]);

  // Fetch lyrics whenever currentSong changes
  useEffect(() => {
    if (!currentSong) {
      setLyricsData(null);
      return;
    }

    let isMounted = true;
    setIsLoadingLyrics(true);

    const vidParam = currentSong.videoId ? `id=${encodeURIComponent(currentSong.videoId)}&` : '';
    const durParam = currentSong.duration ? `&duration=${Math.round(currentSong.duration)}` : '';
    fetch(`/api/lyrics?${vidParam}artist=${encodeURIComponent(currentSong.artist || '')}&title=${encodeURIComponent(currentSong.title || currentSong.name || '')}${durParam}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          if (data && (data.lyrics || data.plainLyrics)) {
            const raw = data.lyrics || data.plainLyrics;
            const lines = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split('\n') : []);
            setLyricsData({
              plainLyrics: Array.isArray(raw) ? raw.join('\n') : raw,
              syncedLyrics: data.syncedLyrics || null,
              instrumental: data.instrumental || false,
              lines,
            });
          } else {
            setLyricsData(null);
          }
          setIsLoadingLyrics(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLyricsData(null);
          setIsLoadingLyrics(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentSong?.id, currentSong?.videoId]);

  // Persist liked songs
  useEffect(() => {
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify(likedSongs));
    } catch {
      // storage full
    }
  }, [likedSongs]);

  // Persist user playlists
  useEffect(() => {
    try {
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
    } catch {
      // storage full
    }
  }, [playlists]);

  // Persist recently played
  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyPlayed));
    } catch {
      // storage full
    }
  }, [recentlyPlayed]);

  // Helper function to parse duration string like "3:55"
  function parseDurationString(d: string): number {
    if (!d) return 180;
    const parts = d.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    return 180;
  }

  // Play a specific song
  const playSong = (song: Song, contextQueue?: Song[]) => {
    setIsMiniPlayerDismissed(false);
    setCurrentTime(0);
    setDuration(song.duration || 200);
    setCurrentSong(song);
    setIsBuffering(true);

    if (song.videoId) {
      // YouTube Engine
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (ytPlayerRef.current) {
        try {
          const iframe = typeof ytPlayerRef.current.getIframe === 'function' ? ytPlayerRef.current.getIframe() : null;
          if (iframe && iframe.parentNode && typeof ytPlayerRef.current.loadVideoById === 'function') {
            ytPlayerRef.current.loadVideoById(song.videoId);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
            setIsBuffering(false);
          } else {
            // Player instance not attached yet or stale, let react-youtube mount handle it
            setIsPlaying(true);
          }
        } catch (err) {
          console.warn('YouTube player playback handled by auto-mount:', err);
          setIsPlaying(true);
        }
      } else {
        // Will be triggered when YT component mounts/ready
        setIsPlaying(true);
      }
    } else {
      // HTML5 Audio Engine
      if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
        try {
          ytPlayerRef.current.stopVideo();
        } catch {
          // ignore
        }
      }
      const audio = audioRef.current;
      if (audio && song.streamUrl) {
        audio.src = song.streamUrl;
        audio.currentTime = 0;
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((err) => {
            console.warn('Playback error:', err);
          });
      }
    }

    // Update queue if provided
    if (contextQueue && contextQueue.length > 0) {
      setQueue(contextQueue);
      const idx = contextQueue.findIndex((s) => s.id === song.id || (s.videoId && s.videoId === song.videoId));
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      // Add to queue if not present
      if (!queue.some((s) => s.id === song.id || (s.videoId && s.videoId === song.videoId))) {
        setQueue((prev) => [song, ...prev]);
        setQueueIndex(0);
      } else {
        const idx = queue.findIndex((s) => s.id === song.id || (s.videoId && s.videoId === song.videoId));
        setQueueIndex(idx);
      }
    }

    // Add to recently played
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id && (!song.videoId || s.videoId !== song.videoId));
      return [song, ...filtered].slice(0, 30);
    });
  };

  const pauseSong = () => {
    setIsPlaying(false);
    if (currentSong?.videoId && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {
        // ignore
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const resumeSong = () => {
    setIsPlaying(true);
    if (currentSong?.videoId && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.playVideo();
      } catch {
        // ignore
      }
    } else if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(console.error);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      if (currentSong) {
        resumeSong();
      }
    }
  };

  const playNext = () => {
    // If we have an active queue
    if (queue.length > 0) {
      let nextIndex = queueIndex + 1;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      }

      if (nextIndex < queue.length) {
        const nextSong = queue[nextIndex];
        setQueueIndex(nextIndex);
        playSong(nextSong);
        return;
      } else if (repeatMode === 'all') {
        const nextSong = queue[0];
        setQueueIndex(0);
        playSong(nextSong);
        return;
      }
    }

    // If queue ended, take from UpNext recommendations!
    if (upNextTracks.length > 0) {
      const nextUp = upNextTracks[0];
      setUpNextTracks((prev) => prev.slice(1));
      addToQueue(nextUp);
      playSong(nextUp);
      return;
    }

    pauseSong();
  };

  const playPrev = () => {
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    if (queue.length === 0) return;

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevSong = queue[prevIndex];
    if (prevSong) {
      setQueueIndex(prevIndex);
      playSong(prevSong);
    }
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
    if (currentSong?.videoId && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(time, true);
      } catch {
        // ignore
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(clamped * 100);
      } catch {
        // ignore
      }
    }
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (ytPlayerRef.current) {
      try {
        if (nextMuted) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      } catch {
        // ignore
      }
    }
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const setAudioQuality = (quality: AudioQuality) => {
    setAudioQualityState(quality);
  };

  // Queue manipulation
  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearQueue = () => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
    }
  };

  // Liked songs
  const toggleLike = (song: Song) => {
    if (!song) return;
    const songKey = song.videoId || song.id;
    setLikedSongs((prev) => {
      const exists = prev.some((s) => {
        const k = s.videoId || s.id;
        return (k && songKey && k === songKey) || (s.title === song.title && s.artist === song.artist);
      });

      if (exists) {
        return prev.filter((s) => {
          const k = s.videoId || s.id;
          if (k && songKey && k === songKey) return false;
          if (s.title === song.title && s.artist === song.artist) return false;
          return true;
        });
      } else {
        return [song, ...prev];
      }
    });
  };

  const isLiked = (songOrId: Song | string) => {
    if (!songOrId) return false;
    if (typeof songOrId === 'string') {
      return likedSongs.some((s) => s.id === songOrId || s.videoId === songOrId);
    }
    const songKey = songOrId.videoId || songOrId.id;
    return likedSongs.some((s) => {
      const k = s.videoId || s.id;
      return (k && songKey && k === songKey) || (s.title === songOrId.title && s.artist === songOrId.artist);
    });
  };

  // Clear history
  const clearHistory = () => {
    setRecentlyPlayed([]);
    localStorage.removeItem(RECENT_KEY);
  };

  // Custom playlists
  const createPlaylist = (name: string, description?: string): string => {
    const newId = `user_${Date.now()}`;
    const newPlaylist: Playlist = {
      id: newId,
      name,
      description: description || 'Playlist buatan Anda',
      songs: [],
      isCustom: true,
      createdAt: Date.now(),
      image: 'https://i.ytimg.com/vi/D47mUu1b_54/hqdefault.jpg',
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
    return newId;
  };

  const addToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          if (pl.songs.some((s) => s.id === song.id || (s.videoId && s.videoId === song.videoId))) return pl;
          return { ...pl, songs: [...pl.songs, song] };
        }
        return pl;
      })
    );
  };

  const removeFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return { ...pl, songs: pl.songs.filter((s) => s.id !== songId && (!s.videoId || s.videoId !== songId)) };
        }
        return pl;
      })
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
    if (activePlaylistId === playlistId) {
      setCurrentView('home');
      setActivePlaylistId(null);
    }
  };

  // Genre & Mood Navigation
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const openGenre = (genre: string) => {
    setSelectedGenre(genre);
    setActivePlaylistId(null);
    setSelectedArtist(null);
    setCurrentView('genre');
  };

  // Downloaded / Cached Songs
  const [downloadedSongs, setDownloadedSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem(DOWNLOADED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DOWNLOADED_KEY, JSON.stringify(downloadedSongs));
    } catch {}
  }, [downloadedSongs]);

  const toggleDownloadSong = (song: Song) => {
    setDownloadedSongs((prev) => {
      const sId = song.videoId || song.id;
      const exists = prev.some((s) => (s.videoId && s.videoId === sId) || s.id === sId);
      if (exists) {
        return prev.filter((s) => (s.videoId && s.videoId !== sId) && s.id !== sId);
      } else {
        return [song, ...prev];
      }
    });
  };

  const isDownloaded = (songId: string) => {
    return downloadedSongs.some((s) => s.id === songId || (s.videoId && s.videoId === songId));
  };

  return (
    <MusicContext.Provider
      value={{
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
        playSong,
        pauseSong,
        resumeSong,
        togglePlay,
        playNext,
        playPrev,
        seekTo,
        setVolume,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        setAudioQuality,
        registerYtPlayer,
        handleYtStateChange,
        ytPlayerRef,
        queue,
        queueIndex,
        addToQueue,
        removeFromQueue,
        clearQueue,
        isQueueOpen,
        setIsQueueOpen,
        upNextTracks,
        isLoadingUpNext,
        likedSongs,
        toggleLike,
        isLiked,
        playlists,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        deletePlaylist,
        currentView,
        setCurrentView,
        activePlaylistId,
        setActivePlaylistId,
        selectedPlaylistData,
        setSelectedPlaylistData,
        openPlaylist,
        selectedArtist,
        setSelectedArtist,
        openArtist,
        searchQuery,
        setSearchQuery,
        activeMood,
        setActiveMood,
        isPlayerExpanded,
        setIsPlayerExpanded,
        isMiniPlayerDismissed,
        setIsMiniPlayerDismissed,
        isLyricsOpen,
        setIsLyricsOpen,
        lyricsData,
        isLoadingLyrics,
        recentlyPlayed,
        isHistoryOpen,
        setIsHistoryOpen,
        clearHistory,
        subscribedArtists,
        toggleSubscribeArtist,
        isArtistSubscribed,
        unsubscribeArtist,
        trackToAddToPlaylist,
        setTrackToAddToPlaylist,
        selectedGenre,
        setSelectedGenre,
        openGenre,
        downloadedSongs,
        toggleDownloadSong,
        isDownloaded,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
