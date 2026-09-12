import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';

const __filenameSafe = typeof import.meta?.url === 'string' ? fileURLToPath(import.meta.url) : '';
const __dirnameSafe = typeof __dirname !== 'undefined' ? __dirname : path.dirname(__filenameSafe || process.cwd());

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for all requests (especially useful on Vercel or external clients)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Media URL decryption using DES-ECB with secret key 38346591
function decryptMediaUrl(encUrl: string | undefined): { primaryUrl: string; quality320: string; quality160: string } | null {
  if (!encUrl) return null;
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encUrl),
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const rawUrl = decrypted.toString(CryptoJS.enc.Utf8);
    if (!rawUrl || !rawUrl.startsWith('http')) return null;

    const quality320 = rawUrl.replace(/_96\.(mp4|m4a)$/, '_320.$1');
    const quality160 = rawUrl.replace(/_96\.(mp4|m4a)$/, '_160.$1');

    return {
      primaryUrl: quality160,
      quality320,
      quality160,
    };
  } catch {
    return null;
  }
}

function cleanHtml(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export interface SongItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  image: string;
  streamUrl: string;
  quality320?: string;
  quality160?: string;
  source: 'saavn' | 'audius';
  year?: string | number;
}

// Search endpoint
app.get('/api/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  // Default to 'song' so we only get individual tracks (satuan lagu)
  const type = (req.query.type as string || 'song').trim();
  if (!query) {
    return res.json([]);
  }

  try {
    const ytUrl = `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`;
    const ytRes = await fetch(ytUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    }).then(r => (r.ok ? r.json() : null)).catch(() => null);

    if (Array.isArray(ytRes) && ytRes.length > 0) {
      if (type === 'artist') {
        const enhancedArtists = ytRes.map((item: any) => {
          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w300-h300-p-l90-rj');
          }
          return {
            type: 'ARTIST',
            artistId: item.artistId || item.id,
            name: item.name || item.title,
            thumbnails: [{ url: bestThumb, width: 300, height: 300 }],
            thumbnail: bestThumb,
            subscribers: item.subscribers,
          };
        });
        return res.json(enhancedArtists);
      }

      if (type === 'album') {
        const albums = ytRes.map((item: any) => {
          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w400-h400-l90-rj');
          }
          return {
            type: 'ALBUM',
            albumId: item.albumId || item.browseId || item.id,
            name: item.name || item.title,
            artist: typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || '',
            year: item.year,
            thumbnails: [{ url: bestThumb, width: 400, height: 400 }],
            thumbnail: bestThumb,
          };
        });
        return res.json(albums);
      }

      if (type === 'playlist') {
        const playlists = ytRes.map((item: any) => {
          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w400-h400-l90-rj');
          }
          return {
            type: 'PLAYLIST',
            playlistId: item.playlistId || item.id,
            name: item.name || item.title,
            thumbnails: [{ url: bestThumb, width: 400, height: 400 }],
            thumbnail: bestThumb,
          };
        });
        return res.json(playlists);
      }

      if (type === 'video') {
        const videos = ytRes.map((item: any) => {
          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (!bestThumb && item.videoId) {
            bestThumb = `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;
          }
          return {
            type: 'VIDEO',
            videoId: item.videoId || item.id,
            id: `yt_${item.videoId || item.id}`,
            title: item.name || item.title,
            name: item.name || item.title,
            artist: typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || '',
            duration: item.duration || 210,
            thumbnails: [{ url: bestThumb, width: 400, height: 400 }],
            thumbnail: bestThumb,
            image: bestThumb,
          };
        });
        return res.json(videos);
      }

      // Default: 'song' - return all legitimate music items with clean metadata
      const filtered = ytRes.filter((item: any) => {
        const videoId = item.videoId || (item.type === 'SONG' ? item.id : null);
        if (!videoId) return false;

        const title = (item.name || item.title || '').toLowerCase().trim();
        const artist = (typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || '').toLowerCase().trim();
        const full = `${title} ${artist}`;

        // Filter out obvious multi-hour spam compilations
        if (/3 jam|4 jam|5 jam/i.test(full)) return false;
        if (title === 'lag...' || title === 'lagu...') return false;

        return true;
      });

      // Enhance thumbnails with high-definition square artwork
      const enhanced = filtered.map((item: any) => {
        let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
        if (bestThumb && bestThumb.includes('googleusercontent.com')) {
          bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
        }
        if (!bestThumb && (item.videoId || item.id)) {
          bestThumb = `https://i.ytimg.com/vi/${item.videoId || item.id}/hqdefault.jpg`;
        }
        return {
          ...item,
          type: 'SONG',
          thumbnail: bestThumb,
          thumbnails: [{ url: bestThumb, width: 600, height: 600 }],
        };
      });

      return res.json(enhanced);
    }

    // Fallback to internal search
    const internalRes = await fetch(`http://localhost:${PORT}/api/music/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .catch(() => null);

    if (internalRes?.results && Array.isArray(internalRes.results)) {
      const formatted = internalRes.results.map((s: SongItem) => ({
        type: 'SONG',
        videoId: s.id.startsWith('yt_') ? s.id.replace('yt_', '') : undefined,
        id: s.id,
        name: s.title,
        title: s.title,
        artist: { name: s.artist },
        artists: s.artist,
        album: { name: s.album },
        duration: s.duration,
        thumbnails: [{ url: s.image, width: 500, height: 500 }],
        streamUrl: s.streamUrl,
        quality320: s.quality320,
        quality160: s.quality160,
      }));
      return res.json(formatted);
    }

    res.json([]);
  } catch (err: any) {
    console.error('API /api/search error:', err);
    res.json([]);
  }
});

// Search suggestions endpoint (Google/YouTube autocomplete with fallback)
app.get('/api/suggestions', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json([]);
  }
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[1])) {
        const cleaned = data[1]
          .filter((item: any) => typeof item === 'string' && item.trim().length > 0)
          .slice(0, 8);
        return res.json(cleaned);
      }
    }
    res.json([]);
  } catch {
    res.json([]);
  }
});

// Cache for home single songs
let homeSongsCache: { data: any[]; timestamp: number } | null = null;

// Dedicated endpoint to scrape authentic single songs (satuan lagu) from risyadh-musik
app.get('/api/home-songs', async (req, res) => {
  const now = Date.now();
  if (homeSongsCache && now - homeSongsCache.timestamp < 300000 && homeSongsCache.data.length > 0) {
    return res.json(homeSongsCache.data);
  }

  try {
    const seedQueries = [
      'Bernadya',
      'Sal Priadi',
      'Juicy Luicy',
      'Hindia',
      'Mahalini',
      'Nadhif Basalamah',
      'Tulus',
      'Anggi Marito',
      'Fabio Asher',
      'Feby Putri',
    ];

    const results = await Promise.allSettled(
      seedQueries.map(q =>
        fetch(`https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(q)}&type=song`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        })
          .then(r => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    );

    const seenVideoIds = new Set<string>();
    const songs: any[] = [];

    for (const resItem of results) {
      if (resItem.status === 'fulfilled' && Array.isArray(resItem.value)) {
        for (const item of resItem.value) {
          const videoId = item.videoId || (item.type === 'SONG' ? item.id : null);
          if (!videoId || seenVideoIds.has(videoId)) continue;

          // Exclude compilation mixes and non-single tracks
          const title = (item.name || item.title || '').toLowerCase();
          const artist = (typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || '').toLowerCase();
          const combined = `${title} ${artist}`;

          if (
            /jugo muzik/i.test(combined) ||
            /kompilasi/i.test(combined) ||
            /kumpulan/i.test(combined) ||
            /full album/i.test(combined) ||
            /terbaik tahun/i.test(combined) ||
            /1 jam/i.test(combined) ||
            /2 jam/i.test(combined)
          ) {
            continue;
          }

          const dur = typeof item.duration === 'number' ? item.duration : 0;
          if (dur > 540) continue;

          seenVideoIds.add(videoId);

          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
          }
          if (!bestThumb) {
            bestThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          }

          songs.push({
            id: `yt_${videoId}`,
            videoId,
            title: item.name || item.title,
            name: item.name || item.title,
            artist: typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || 'Artis',
            artists: typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || 'Artis',
            album: item.album?.name || 'Single',
            duration: item.duration || 210,
            image: bestThumb,
            source: 'youtube',
          });
        }
      }
    }

    if (songs.length > 0) {
      homeSongsCache = { data: songs, timestamp: now };
      return res.json(songs);
    }

    return res.json([]);
  } catch (err) {
    console.error('Error fetching home songs:', err);
    res.json([]);
  }
});

// Dedicated Home Sections API endpoint for rich Indonesian homepage sections
app.get('/api/home-sections', async (req, res) => {
  try {
    const homeSectionsData = {
      pilihan: [
        {
          id: 'yt_eVli-tstM5E',
          videoId: 'eVli-tstM5E',
          title: 'Espresso',
          artist: 'Sabrina Carpenter',
          album: 'Short n\' Sweet',
          duration: 175,
          image: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_7qVz_vWwT_Y',
          videoId: '7qVz_vWwT_Y',
          title: 'Bollywood Dj Non Stop',
          artist: 'DJ NYK',
          album: 'Bollywood Remix',
          duration: 320,
          image: 'https://i.ytimg.com/vi/7qVz_vWwT_Y/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_5m0O2yHkW64',
          videoId: '5m0O2yHkW64',
          title: 'Biri Marung',
          artist: 'Dayak Mix',
          album: 'Tradisional',
          duration: 215,
          image: 'https://i.ytimg.com/vi/5m0O2yHkW64/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_fCZVL_8D048',
          videoId: 'fCZVL_8D048',
          title: 'Jerusalema',
          artist: 'Master KG ft. Nomcebo',
          album: 'Jerusalema',
          duration: 330,
          image: 'https://i.ytimg.com/vi/fCZVL_8D048/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_1k8craCGpgs',
          videoId: '1k8craCGpgs',
          title: 'Journey (2024 Remaster)',
          artist: 'Journey',
          album: 'Escape',
          duration: 250,
          image: 'https://i.ytimg.com/vi/1k8craCGpgs/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_kffacxfA7G4',
          videoId: 'kffacxfA7G4',
          title: 'Party Mashup - DJ Praveen',
          artist: 'DJ Praveen',
          album: 'Party Hits',
          duration: 290,
          image: 'https://i.ytimg.com/vi/kffacxfA7G4/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_9V2g0_p8r0A',
          videoId: '9V2g0_p8r0A',
          title: 'Sthandwa Sam',
          artist: 'Boohle',
          album: 'Amapiano',
          duration: 310,
          image: 'https://i.ytimg.com/vi/9V2g0_p8r0A/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_TUVcZfQe-Kw',
          videoId: 'TUVcZfQe-Kw',
          title: 'Levitating',
          artist: 'Dua Lipa',
          album: 'Future Nostalgia',
          duration: 203,
          image: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_Uq9gPaIzbe8',
          videoId: 'Uq9gPaIzbe8',
          title: 'Unholy',
          artist: 'Sam Smith, Kim Petras',
          album: 'Gloria',
          duration: 156,
          image: 'https://i.ytimg.com/vi/Uq9gPaIzbe8/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_kPa7bsKwL-c',
          videoId: 'kPa7bsKwL-c',
          title: 'Die With A Smile',
          artist: 'Lady Gaga & Bruno Mars',
          album: 'Single',
          duration: 251,
          image: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_d5gf9dXbPi0',
          videoId: 'd5gf9dXbPi0',
          title: 'Birds of a Feather',
          artist: 'Billie Eilish',
          album: 'HIT ME HARD AND SOFT',
          duration: 193,
          image: 'https://i.ytimg.com/vi/d5gf9dXbPi0/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_toea6L580kM',
          videoId: 'toea6L580kM',
          title: 'Greedy',
          artist: 'Tate McRae',
          album: 'THINK LATER',
          duration: 131,
          image: 'https://i.ytimg.com/vi/toea6L580kM/hqdefault.jpg',
          source: 'youtube'
        }
      ],
      pamungkasSection: {
        artist: {
          name: 'Pamungkas',
          artistId: 'UC_pamungkas_official',
          image: 'https://yt3.googleusercontent.com/9lQ6Q_1M4uC7wQyH4xR1rQZ9r6tN_8a3k0e9h7-J-g=w300-h300-l90-rj'
        },
        tracks: [
          {
            id: 'yt_6b_1g_k2n_k',
            videoId: '6b_1g_k2n_k',
            title: 'Adam',
            artist: 'Pamungkas',
            album: 'Hardcore Romance',
            duration: 284,
            image: 'https://i.ytimg.com/vi/6b_1g_k2n_k/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_4bA_J5cM9_0',
            videoId: '4bA_J5cM9_0',
            title: 'To the Bone',
            artist: 'Pamungkas',
            album: 'Flying Solo',
            duration: 345,
            image: 'https://i.ytimg.com/vi/4bA_J5cM9_0/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_y83x7MgzWOA',
            videoId: 'y83x7MgzWOA',
            title: 'Hanya Kali Kita Ada',
            artist: 'Pamungkas',
            album: 'Hardcore Romance',
            duration: 280,
            image: 'https://i.ytimg.com/vi/y83x7MgzWOA/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_j2V4r5C6g7A',
            videoId: 'j2V4r5C6g7A',
            title: 'Closure',
            artist: 'Pamungkas',
            album: 'Solipsism 0.2',
            duration: 232,
            image: 'https://i.ytimg.com/vi/j2V4r5C6g7A/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_vXb7e_4q9w8',
            videoId: 'vXb7e_4q9w8',
            title: 'Monolog',
            artist: 'Pamungkas',
            album: 'Walk The Talk',
            duration: 220,
            image: 'https://i.ytimg.com/vi/vXb7e_4q9w8/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_p0m2a8_7w6x',
            videoId: 'p0m2a8_7w6x',
            title: 'Flying Solo',
            artist: 'Pamungkas',
            album: 'Flying Solo',
            duration: 215,
            image: 'https://i.ytimg.com/vi/p0m2a8_7w6x/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_y5u3n7_0z2w',
            videoId: 'y5u3n7_0z2w',
            title: 'One Only',
            artist: 'Pamungkas',
            album: 'Walk The Talk',
            duration: 255,
            image: 'https://i.ytimg.com/vi/y5u3n7_0z2w/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_e8n9b4_2v7y',
            videoId: 'e8n9b4_2v7y',
            title: 'I Love You But I\'m Letting Go',
            artist: 'Pamungkas',
            album: 'Walk The Talk',
            duration: 222,
            image: 'https://i.ytimg.com/vi/e8n9b4_2v7y/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_q8z7x6_3c2v',
            videoId: 'q8z7x6_3c2v',
            title: 'Kenangan Manis',
            artist: 'Pamungkas',
            album: 'Walk The Talk',
            duration: 208,
            image: 'https://i.ytimg.com/vi/q8z7x6_3c2v/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_l8k7j6_5h4g',
            videoId: 'l8k7j6_5h4g',
            title: 'Be My Friend',
            artist: 'Pamungkas',
            album: 'Solipsism',
            duration: 195,
            image: 'https://i.ytimg.com/vi/l8k7j6_5h4g/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_m9n8b7_6v5c',
            videoId: 'm9n8b7_6v5c',
            title: 'Live Forever',
            artist: 'Pamungkas',
            album: 'Solipsism',
            duration: 242,
            image: 'https://i.ytimg.com/vi/m9n8b7_6v5c/hqdefault.jpg',
            source: 'youtube'
          },
          {
            id: 'yt_x7c6v5_4b3n',
            videoId: 'x7c6v5_4b3n',
            title: 'Sorry',
            artist: 'Pamungkas',
            album: 'Walk The Talk',
            duration: 210,
            image: 'https://i.ytimg.com/vi/x7c6v5_4b3n/hqdefault.jpg',
            source: 'youtube'
          }
        ]
      },
      top50Indonesia: [
        {
          id: 'yt_zen_med',
          videoId: '1ZYbU87028U',
          title: 'Zen Meditation Music',
          artist: 'Zen Relaxing',
          album: 'Peaceful Mind',
          duration: 300,
          image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        },
        {
          id: 'yt_infinity_jy',
          videoId: 'pw-9qB3V7rA',
          title: 'Infinity',
          artist: 'Jaymes Young',
          album: 'Feel Something',
          duration: 237,
          image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        },
        {
          id: 'yt_kick_back',
          videoId: 'M2cckDmNLMI',
          title: 'KICK BACK',
          artist: 'Kenshi Yonezu',
          album: 'Chainsaw Man',
          duration: 193,
          image: 'https://i.ytimg.com/vi/M2cckDmNLMI/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_lABZ_-uhC0E',
          videoId: 'lABZ_-uhC0E',
          title: 'Gala bunga matahari',
          artist: 'Sal Priadi',
          album: 'MARKERS AND SUCH',
          duration: 210,
          image: 'https://i.ytimg.com/vi/lABZ_-uhC0E/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_z-XHpftdXEE',
          videoId: 's_K8_f9l4kI',
          title: 'Satu Bulan',
          artist: 'Bernadya',
          album: 'Sialnya, Hidup Harus Tetap Berjalan',
          duration: 201,
          image: 'https://i.ytimg.com/vi/s_K8_f9l4kI/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_xTQvdE1oOaw',
          videoId: 'xTQvdE1oOaw',
          title: 'Rumah Ke Rumah',
          artist: 'Hindia',
          album: 'Menari Dengan Bayangan',
          duration: 278,
          image: 'https://i.ytimg.com/vi/xTQvdE1oOaw/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_masing_masing',
          videoId: 's_K8_f9l4kI',
          title: 'Masing-Masing',
          artist: 'Ernie Zakri, Ade Govinda',
          album: 'Aura',
          duration: 236,
          image: 'https://i.ytimg.com/vi/s_K8_f9l4kI/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_sial_mahalini',
          videoId: '1qP3p1N5wF8',
          title: 'Sial',
          artist: 'Mahalini',
          album: 'FABULA',
          duration: 243,
          image: 'https://i.ytimg.com/vi/1qP3p1N5wF8/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_komang_raim',
          videoId: 'b5mN0_3g2vQ',
          title: 'Komang',
          artist: 'Raim Laode',
          album: 'Single',
          duration: 222,
          image: 'https://i.ytimg.com/vi/b5mN0_3g2vQ/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_jiwa_yang_bersedih',
          videoId: '1qP3p1N5wF8',
          title: 'Jiwa Yang Bersedih',
          artist: 'Ghea Indrawari',
          album: 'Single',
          duration: 278,
          image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        }
      ],
      surrenderToTheBeat: [
        {
          id: 'yt_jj_gaspol',
          videoId: '9ZR4G6CqqQA',
          title: 'Jedag Jedug Sampai Pagi',
          artist: 'JJ GASPOL',
          album: 'DJ Jedag Jedug',
          duration: 214,
          image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        },
        {
          id: 'yt_jj_buncit',
          videoId: '9ZR4G6CqqQA',
          title: 'Jedag Jedug Full Bass',
          artist: 'Goyang Buncit',
          album: 'Bass Boosted',
          duration: 205,
          image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        },
        {
          id: 'yt_jj_tiktok',
          videoId: 'k3-FWnkfi9U',
          title: 'Jedag Jedug TikTok Viral',
          artist: 'Evolusi Music',
          album: 'TikTok DJ',
          duration: 198,
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        },
        {
          id: 'yt_dj_malam_pagi',
          videoId: '9ZR4G6CqqQA',
          title: 'DJ Malam Pagi',
          artist: 'Saixse, DJ Desa',
          album: 'Remix Viral',
          duration: 215,
          image: 'https://i.ytimg.com/vi/9ZR4G6CqqQA/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_dj_cikini',
          videoId: 'UF4j7r2jV50',
          title: 'DJ Cikini Ke Gondangdia',
          artist: 'Duo Anggun Remix',
          album: 'Koplo Mix',
          duration: 190,
          image: 'https://i.ytimg.com/vi/UF4j7r2jV50/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_dj_santuy',
          videoId: 'tC9TKJ0A4-s',
          title: 'DJ Santuy Slow Bass',
          artist: 'DJ Opus',
          album: 'Santuy Mengkane',
          duration: 240,
          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        }
      ],
      funThrowbacks: [
        {
          id: 'yt_letto_ruang',
          videoId: '5QMsYmJYUlQ',
          title: 'Ruang Rindu',
          artist: 'Letto',
          album: 'Truth, Cry, and Lie',
          duration: 211,
          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        },
        {
          id: 'yt_dian_sendiri',
          videoId: '5QMsYmJYUlQ',
          title: 'Tak Ingin Sendiri',
          artist: 'Dian Piesesha',
          album: 'Nostalgia Emas',
          duration: 260,
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        },
        {
          id: 'yt_so7_dan',
          videoId: '5QMsYmJYUlQ',
          title: 'Dan...',
          artist: 'Sheila On 7',
          album: 'Sheila On 7',
          duration: 288,
          image: 'https://i.ytimg.com/vi/5QMsYmJYUlQ/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_dewa_kangen',
          videoId: 'xTQvdE1oOaw',
          title: 'Kangen',
          artist: 'Dewa 19',
          album: '19',
          duration: 310,
          image: 'https://i.ytimg.com/vi/xTQvdE1oOaw/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_so7_sephia',
          videoId: '5QMsYmJYUlQ',
          title: 'Sephia',
          artist: 'Sheila On 7',
          album: 'Kisah Klasik Untuk Masa Depan',
          duration: 295,
          image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&auto=format&fit=crop&q=80',
          source: 'youtube'
        },
        {
          id: 'yt_peterpan_jejakmu',
          videoId: 'Lw17JMX-ILk',
          title: 'Menghapus Jejakmu',
          artist: 'Peterpan',
          album: 'Hari Yang Cerah',
          duration: 185,
          image: 'https://i.ytimg.com/vi/Lw17JMX-ILk/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_iwan_kemesraan',
          videoId: 'cVf4krniHoI',
          title: 'Kemesraan',
          artist: 'Iwan Fals',
          album: 'Kemesraan',
          duration: 302,
          image: 'https://i.ytimg.com/vi/cVf4krniHoI/hqdefault.jpg',
          source: 'youtube'
        }
      ],
      moreLikeChill: [
        {
          id: 'yt_lounge_bar',
          videoId: 'bZgWdInM3xK',
          title: 'Lounge Bar Chillout',
          artist: 'Palm Tree Lounge',
          album: 'Chill Waves',
          duration: 210,
          image: 'https://i.ytimg.com/vi/bZgWdInM3xK/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_relax_guitar',
          videoId: 'kO1gvHp52l0',
          title: 'Relaxing Guitar Music',
          artist: 'Nature Sounds',
          album: 'Acoustic Chill',
          duration: 240,
          image: 'https://i.ytimg.com/vi/kO1gvHp52l0/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_night_soothing',
          videoId: 'ryOGtcqThn-',
          title: 'Night Soothing',
          artist: 'Power Sleep',
          album: 'Sleep Well',
          duration: 260,
          image: 'https://i.ytimg.com/vi/ryOGtcqThn-/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_morning_coffee',
          videoId: '_eDXK2OSYog',
          title: 'Sunday Morning Coffee',
          artist: 'Chill Sunset',
          album: 'Coffee Shop Vibes',
          duration: 195,
          image: 'https://i.ytimg.com/vi/_eDXK2OSYog/hqdefault.jpg',
          source: 'youtube'
        },
        {
          id: 'yt_lofi_study',
          videoId: 'AOuv6LngN-J',
          title: 'Lofi Study Session',
          artist: 'ChillHop Music',
          album: 'Lofi Beats',
          duration: 185,
          image: 'https://i.ytimg.com/vi/AOuv6LngN-J/hqdefault.jpg',
          source: 'youtube'
        }
      ],
      suasanaHatiDanGenre: [
        { name: 'Chill', color: '#2B4C5F', gradient: 'from-cyan-900 to-slate-900' },
        { name: 'Commute', color: '#3A3F58', gradient: 'from-indigo-950 to-neutral-900' },
        { name: 'Energy', color: '#6E3A2F', gradient: 'from-orange-950 to-neutral-900' },
        { name: 'Focus', color: '#264D3B', gradient: 'from-emerald-950 to-neutral-900' },
        { name: 'Gaming', color: '#4A2A68', gradient: 'from-purple-950 to-neutral-900' },
        { name: 'Party', color: '#682A4A', gradient: 'from-pink-950 to-neutral-900' },
        { name: 'Romance', color: '#632B3C', gradient: 'from-rose-950 to-neutral-900' },
        { name: 'Sleep', color: '#1E293B', gradient: 'from-slate-950 to-neutral-900' },
        { name: 'Workout', color: '#5B3722', gradient: 'from-amber-950 to-neutral-900' },
        { name: 'Indie', color: '#334155', gradient: 'from-slate-900 to-neutral-950' },
        { name: 'Pop', color: '#502D4E', gradient: 'from-fuchsia-950 to-neutral-900' },
        { name: 'Rock', color: '#452626', gradient: 'from-red-950 to-neutral-900' },
        { name: 'R&B', color: '#312E81', gradient: 'from-blue-950 to-neutral-900' },
        { name: 'Dangdut', color: '#4D3823', gradient: 'from-yellow-950 to-neutral-900' },
        { name: 'Jazz', color: '#2E3B4E', gradient: 'from-blue-950 to-slate-900' },
        { name: 'Klasik', color: '#2D3748', gradient: 'from-gray-900 to-neutral-950' },
        { name: 'Akustik', color: '#3E342B', gradient: 'from-stone-900 to-neutral-950' },
        { name: 'Galau', color: '#2B2F44', gradient: 'from-slate-900 to-zinc-950' }
      ],
      communityPlaylists: [
        {
          id: 'comm_1',
          title: 'Chill Songs - Spotify',
          trackCount: '100 lagu',
          gridCovers: [
            'https://yt3.googleusercontent.com/qHqGMmCC4LahCshElRTm8kuJQu4IyDClDx__HiqqydFVMUi2JOfEyZpqootNb1WswJwapw8c8SCmOMuMiQ=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/q0szuVtXvUdftTC8k9fjwazdEpoaCyWTZ1d5Xa3GWHhQPD6_59W_rPlmZRFa2rSFPLTmfOGEgvPfF9uBVg=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/Uj5cYGSdnLCHlw6leWNwDQ6VcjgrNTAfZ-9LAceGci14yOMTwEPlSpMaxyLLCPUVerftYRSlSmuT5t5C=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w300-h300-l90-rj'
          ],
          covers: [
            'https://yt3.googleusercontent.com/qHqGMmCC4LahCshElRTm8kuJQu4IyDClDx__HiqqydFVMUi2JOfEyZpqootNb1WswJwapw8c8SCmOMuMiQ=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/q0szuVtXvUdftTC8k9fjwazdEpoaCyWTZ1d5Xa3GWHhQPD6_59W_rPlmZRFa2rSFPLTmfOGEgvPfF9uBVg=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/Uj5cYGSdnLCHlw6leWNwDQ6VcjgrNTAfZ-9LAceGci14yOMTwEPlSpMaxyLLCPUVerftYRSlSmuT5t5C=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w300-h300-l90-rj'
          ],
          songs: [
            {
              id: 'yt_MX7FSAnRPug',
              videoId: 'MX7FSAnRPug',
              title: 'Loser',
              artist: 'Tame Impala',
              album: 'Chill Mood',
              duration: 214,
              image: 'https://yt3.googleusercontent.com/qHqGMmCC4LahCshElRTm8kuJQu4IyDClDx__HiqqydFVMUi2JOfEyZpqootNb1WswJwapw8c8SCmOMuMiQ=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_P7VgXIZSN_w',
              videoId: 'P7VgXIZSN_w',
              title: 'stupid song',
              artist: 'Olivia Rodrigo',
              album: 'GUTS',
              duration: 182,
              image: 'https://yt3.googleusercontent.com/q0szuVtXvUdftTC8k9fjwazdEpoaCyWTZ1d5Xa3GWHhQPD6_59W_rPlmZRFa2rSFPLTmfOGEgvPfF9uBVg=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_2zPGWGqdfJ8',
              videoId: '2zPGWGqdfJ8',
              title: 'oh yeah? (Visualizer)',
              artist: 'Steve Lacy',
              album: 'Gemini Rights',
              duration: 175,
              image: 'https://yt3.googleusercontent.com/Uj5cYGSdnLCHlw6leWNwDQ6VcjgrNTAfZ-9LAceGci14yOMTwEPlSpMaxyLLCPUVerftYRSlSmuT5t5C=w300-h300-l90-rj',
              source: 'youtube'
            }
          ],
          tracks: [
            {
              id: 'yt_MX7FSAnRPug',
              videoId: 'MX7FSAnRPug',
              title: 'Loser',
              artist: 'Tame Impala',
              album: 'Chill Mood',
              duration: 214,
              image: 'https://yt3.googleusercontent.com/qHqGMmCC4LahCshElRTm8kuJQu4IyDClDx__HiqqydFVMUi2JOfEyZpqootNb1WswJwapw8c8SCmOMuMiQ=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_P7VgXIZSN_w',
              videoId: 'P7VgXIZSN_w',
              title: 'stupid song',
              artist: 'Olivia Rodrigo',
              album: 'GUTS',
              duration: 182,
              image: 'https://yt3.googleusercontent.com/q0szuVtXvUdftTC8k9fjwazdEpoaCyWTZ1d5Xa3GWHhQPD6_59W_rPlmZRFa2rSFPLTmfOGEgvPfF9uBVg=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_2zPGWGqdfJ8',
              videoId: '2zPGWGqdfJ8',
              title: 'oh yeah? (Visualizer)',
              artist: 'Steve Lacy',
              album: 'Gemini Rights',
              duration: 175,
              image: 'https://yt3.googleusercontent.com/Uj5cYGSdnLCHlw6leWNwDQ6VcjgrNTAfZ-9LAceGci14yOMTwEPlSpMaxyLLCPUVerftYRSlSmuT5t5C=w300-h300-l90-rj',
              source: 'youtube'
            }
          ]
        },
        {
          id: 'comm_2',
          title: 'CLOSE WITH YOU - TEO',
          trackCount: '85 lagu',
          gridCovers: [
            'https://yt3.googleusercontent.com/CNJzI56YM9Lm4CfscfWmLiBcF_vWhNpXKZpfAjLEiELf2eDIY-YvM0vPXMNUxmwJNtWeRqUJyxi-4DpO=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/7oX7kccOMbD9v7SqDbSwHHoLQogdM1QWPyfSaeCUD9FMFj8pJK9dXYdR7bM8hH9S8bGWH2IXnLFtuGdx=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/Gq0LtcHfMAp1VsMM0cHxeKEoy9rILYNAjxx6_Pn_4cVz2v2QLAP5mYJm0aeiJIVQBF85Wi1p1Vu5Dq1X=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/EhJCP_-PRh3_78t1fSouQ7D3mrBszq3mmXSc1JRxawuMr8C3Gq0bKC--XP1dXp4KW8UdLX09LXba8F4=w300-h300-l90-rj'
          ],
          covers: [
            'https://yt3.googleusercontent.com/CNJzI56YM9Lm4CfscfWmLiBcF_vWhNpXKZpfAjLEiELf2eDIY-YvM0vPXMNUxmwJNtWeRqUJyxi-4DpO=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/7oX7kccOMbD9v7SqDbSwHHoLQogdM1QWPyfSaeCUD9FMFj8pJK9dXYdR7bM8hH9S8bGWH2IXnLFtuGdx=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/Gq0LtcHfMAp1VsMM0cHxeKEoy9rILYNAjxx6_Pn_4cVz2v2QLAP5mYJm0aeiJIVQBF85Wi1p1Vu5Dq1X=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/EhJCP_-PRh3_78t1fSouQ7D3mrBszq3mmXSc1JRxawuMr8C3Gq0bKC--XP1dXp4KW8UdLX09LXba8F4=w300-h300-l90-rj'
          ],
          songs: [
            {
              id: 'yt_5QMsYmJYUlQ',
              videoId: '5QMsYmJYUlQ',
              title: 'Kita Usahakan Lagi',
              artist: 'Batas Senja',
              album: 'Single',
              duration: 234,
              image: 'https://yt3.googleusercontent.com/CNJzI56YM9Lm4CfscfWmLiBcF_vWhNpXKZpfAjLEiELf2eDIY-YvM0vPXMNUxmwJNtWeRqUJyxi-4DpO=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_xTQvdE1oOaw',
              videoId: 'xTQvdE1oOaw',
              title: 'Rumah Ke Rumah',
              artist: 'Hindia',
              album: 'Menari Dengan Bayangan',
              duration: 278,
              image: 'https://yt3.googleusercontent.com/7oX7kccOMbD9v7SqDbSwHHoLQogdM1QWPyfSaeCUD9FMFj8pJK9dXYdR7bM8hH9S8bGWH2IXnLFtuGdx=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_dsOGH_ZBdCM',
              videoId: 'dsOGH_ZBdCM',
              title: 'Masa ini, Nanti, dan Masa Depan',
              artist: 'Nuca',
              album: 'Single',
              duration: 276,
              image: 'https://yt3.googleusercontent.com/Gq0LtcHfMAp1VsMM0cHxeKEoy9rILYNAjxx6_Pn_4cVz2v2QLAP5mYJm0aeiJIVQBF85Wi1p1Vu5Dq1X=w300-h300-l90-rj',
              source: 'youtube'
            }
          ],
          tracks: [
            {
              id: 'yt_5QMsYmJYUlQ',
              videoId: '5QMsYmJYUlQ',
              title: 'Kita Usahakan Lagi',
              artist: 'Batas Senja',
              album: 'Single',
              duration: 234,
              image: 'https://yt3.googleusercontent.com/CNJzI56YM9Lm4CfscfWmLiBcF_vWhNpXKZpfAjLEiELf2eDIY-YvM0vPXMNUxmwJNtWeRqUJyxi-4DpO=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_xTQvdE1oOaw',
              videoId: 'xTQvdE1oOaw',
              title: 'Rumah Ke Rumah',
              artist: 'Hindia',
              album: 'Menari Dengan Bayangan',
              duration: 278,
              image: 'https://yt3.googleusercontent.com/7oX7kccOMbD9v7SqDbSwHHoLQogdM1QWPyfSaeCUD9FMFj8pJK9dXYdR7bM8hH9S8bGWH2IXnLFtuGdx=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_dsOGH_ZBdCM',
              videoId: 'dsOGH_ZBdCM',
              title: 'Masa ini, Nanti, dan Masa Depan',
              artist: 'Nuca',
              album: 'Single',
              duration: 276,
              image: 'https://yt3.googleusercontent.com/Gq0LtcHfMAp1VsMM0cHxeKEoy9rILYNAjxx6_Pn_4cVz2v2QLAP5mYJm0aeiJIVQBF85Wi1p1Vu5Dq1X=w300-h300-l90-rj',
              source: 'youtube'
            }
          ]
        },
        {
          id: 'comm_3',
          title: 'Indie Senja Indonesia',
          trackCount: '120 lagu',
          gridCovers: [
            'https://yt3.googleusercontent.com/pP42VdTGrlRG0oCRZdgwhZ57R6CpfWDtewbZ9Mlg6gNoKWAjY4R59sGt_Le_zdWHh6hpNeRobL8aBVxwVQ=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/ZTeVzkcAoQ7F8tA1D7JZw_27xBRpZB1Hm01x7DV3Uzr50tCpe_1sJhrfgpq8mPJAFtka1s-1ixfVN7o=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/Uf_KmzeaQQa2N8Ep9thCOc8sPPvaF-3J4F58JkK4xEbQrmiy8u63oeNJ7RxV6n0FGQHTs4EncmgFeMA=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w300-h300-l90-rj'
          ],
          covers: [
            'https://yt3.googleusercontent.com/pP42VdTGrlRG0oCRZdgwhZ57R6CpfWDtewbZ9Mlg6gNoKWAjY4R59sGt_Le_zdWHh6hpNeRobL8aBVxwVQ=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/ZTeVzkcAoQ7F8tA1D7JZw_27xBRpZB1Hm01x7DV3Uzr50tCpe_1sJhrfgpq8mPJAFtka1s-1ixfVN7o=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/Uf_KmzeaQQa2N8Ep9thCOc8sPPvaF-3J4F58JkK4xEbQrmiy8u63oeNJ7RxV6n0FGQHTs4EncmgFeMA=w300-h300-l90-rj',
            'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w300-h300-l90-rj'
          ],
          songs: [
            {
              id: 'yt_Zq1Jg0H5fzc',
              videoId: 'Zq1Jg0H5fzc',
              title: 'everything u are',
              artist: 'Hindia',
              album: 'Single',
              duration: 237,
              image: 'https://yt3.googleusercontent.com/pP42VdTGrlRG0oCRZdgwhZ57R6CpfWDtewbZ9Mlg6gNoKWAjY4R59sGt_Le_zdWHh6hpNeRobL8aBVxwVQ=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_vsIdtK8wQ4o',
              videoId: 'vsIdtK8wQ4o',
              title: 'Reservasi Untuk Dua',
              artist: 'Nadin Amizah',
              album: 'Single',
              duration: 260,
              image: 'https://yt3.googleusercontent.com/ZTeVzkcAoQ7F8tA1D7JZw_27xBRpZB1Hm01x7DV3Uzr50tCpe_1sJhrfgpq8mPJAFtka1s-1ixfVN7o=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_lABZ_-uhC0E',
              videoId: 'lABZ_-uhC0E',
              title: 'Gala bunga matahari',
              artist: 'Sal Priadi',
              album: 'MARKERS AND SUCH',
              duration: 210,
              image: 'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w300-h300-l90-rj',
              source: 'youtube'
            }
          ],
          tracks: [
            {
              id: 'yt_Zq1Jg0H5fzc',
              videoId: 'Zq1Jg0H5fzc',
              title: 'everything u are',
              artist: 'Hindia',
              album: 'Single',
              duration: 237,
              image: 'https://yt3.googleusercontent.com/pP42VdTGrlRG0oCRZdgwhZ57R6CpfWDtewbZ9Mlg6gNoKWAjY4R59sGt_Le_zdWHh6hpNeRobL8aBVxwVQ=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_vsIdtK8wQ4o',
              videoId: 'vsIdtK8wQ4o',
              title: 'Reservasi Untuk Dua',
              artist: 'Nadin Amizah',
              album: 'Single',
              duration: 260,
              image: 'https://yt3.googleusercontent.com/ZTeVzkcAoQ7F8tA1D7JZw_27xBRpZB1Hm01x7DV3Uzr50tCpe_1sJhrfgpq8mPJAFtka1s-1ixfVN7o=w300-h300-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_lABZ_-uhC0E',
              videoId: 'lABZ_-uhC0E',
              title: 'Gala bunga matahari',
              artist: 'Sal Priadi',
              album: 'MARKERS AND SUCH',
              duration: 210,
              image: 'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w300-h300-l90-rj',
              source: 'youtube'
            }
          ]
        }
      ],
      listeningArtists: [
        {
          name: 'Noah',
          artistId: 'UCCMnLkUAdm_NGMDTTC-nvDQ',
          image: 'https://lh3.googleusercontent.com/6xEP8mOA5xguCiwfeNq08D1o0GK7iPSNMwp80jJpyxw4bwdOgo4EO-8T4rnb8gv3_283YEoQsZvRLD4k=w400-h400-p-l90-rj',
          subscribers: 'Band Resmi'
        },
        {
          name: 'Geisha',
          artistId: 'UCDkv8TdCmYHL9sep2Ag3SFw',
          image: 'https://lh3.googleusercontent.com/o7133qRp70fjJZi5vqQrZ5B66FIbfiJ9ELWq3YaAQR05uVvIY0fcW4E4U33cBdzxpGR8O1Gy7_A7OakI=w400-h400-p-l90-rj',
          subscribers: 'Band Resmi'
        },
        {
          name: 'Mahalini',
          artistId: 'UCa1eYN7cwBQrOFQLt_K8c-Q',
          image: 'https://yt3.googleusercontent.com/VdgLqr3Sno_U1IXj9qzk43azloCsjBeDy6MpFjfD8kMmco0AeL81qow0cpHynDfpaVlujCY11O7QO4d6=w400-h400-p-l90-rj',
          subscribers: 'Artis Resmi'
        },
        {
          name: 'Bernadya',
          artistId: 'UCUn9Xjvg8fwqpa58-_XO6zw',
          image: 'https://lh3.googleusercontent.com/hxROE1fvLWSxUYAFV3IgMp5vvjN91Jx6oS6uwSVyYN9_fb3I6PLaRa3Ufb4A0awxq4J5UoPFQAQM-Q=w400-h400-p-l90-rj',
          subscribers: 'Artis Resmi'
        },
        {
          name: 'Sal Priadi',
          artistId: 'UCs1Iq1CQQDwTUUUtVhXmK6g',
          image: 'https://lh3.googleusercontent.com/wmItRT4hTCJrmnlsh_JBgOeBXww9mquXhrNR0oW3_hPW9LsZ5Z2grMij01EaENdt6ensOJfKm-OCBKqJ=w400-h400-p-l90-rj',
          subscribers: 'Artis Resmi'
        },
        {
          name: 'Hindia',
          artistId: 'UCzhVLh7xVyH3MpqO_KY6SYg',
          image: 'https://yt3.googleusercontent.com/8ImMAMQSD4FA6-gdqCZWSFaB-drHvkdfiFcFAk7Mcyy56ctfWD-Xxno-CHfGC4L6Ql8aR61XT0vX0F4b=w400-h400-p-l90-rj',
          subscribers: 'Artis Resmi'
        },
        {
          name: 'Juicy Luicy',
          artistId: 'UCYBtTmBP2QgHgalgsv2v5LA',
          image: 'https://yt3.googleusercontent.com/DDebW5VciXI_oMRQC1cRIWlpDIWVaS8c_CbcCkf89YeHVziP9lkgA0xUZmmVRxGKmC3qmppuMtvIsa5U=w400-h400-p-l90-rj',
          subscribers: 'Band Resmi'
        },
        {
          name: 'Tulus',
          artistId: 'UC_DHlXllTSMB8pTC38_leFg',
          image: 'https://yt3.googleusercontent.com/h8P1jEIZLM8lkMxNA6Nbq98b43wcqllJSNmcZTCRPAB-F6rG_0Nqw5w7fwou0PN1QGwSW5viwWD5NV0=w400-h400-p-l90-rj',
          subscribers: 'Artis Resmi'
        },
        {
          name: 'Nadin Amizah',
          artistId: 'UCZhZaUHxvz-cxWFhYaWKmtw',
          image: 'https://yt3.googleusercontent.com/1MrTMYk3XQeTy0EDkJOOkRaHwV2jo-8Es2y8ksOyDThn1btv3VrtzRJy8PbRzVY1V-xj9DBaELpR8jnS=w400-h400-p-l90-rj',
          subscribers: 'Artis Resmi'
        }
      ],
      trendingNow: [
        {
          id: 'yt_dsOGH_ZBdCM',
          videoId: 'dsOGH_ZBdCM',
          title: 'ini, Nanti, dan Masa Indah Lainnya',
          artist: 'Nuca',
          album: 'Single',
          duration: 276,
          image: 'https://yt3.googleusercontent.com/Gq0LtcHfMAp1VsMM0cHxeKEoy9rILYNAjxx6_Pn_4cVz2v2QLAP5mYJm0aeiJIVQBF85Wi1p1Vu5Dq1X=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_5QMsYmJYUlQ',
          videoId: '5QMsYmJYUlQ',
          title: 'Kita Usahakan Lagi',
          artist: 'Batas Senja',
          album: 'Single',
          duration: 234,
          image: 'https://yt3.googleusercontent.com/CNJzI56YM9Lm4CfscfWmLiBcF_vWhNpXKZpfAjLEiELf2eDIY-YvM0vPXMNUxmwJNtWeRqUJyxi-4DpO=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_D0fzGl640wE',
          videoId: 'D0fzGl640wE',
          title: 'Jangan Paksa Rindu (Beda)',
          artist: 'Ifan Seventeen',
          album: 'Single',
          duration: 246,
          image: 'https://yt3.googleusercontent.com/EhJCP_-PRh3_78t1fSouQ7D3mrBszq3mmXSc1JRxawuMr8C3Gq0bKC--XP1dXp4KW8UdLX09LXba8F4=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_lABZ_-uhC0E',
          videoId: 'lABZ_-uhC0E',
          title: 'Gala bunga matahari',
          artist: 'Sal Priadi',
          album: 'MARKERS AND SUCH',
          duration: 210,
          image: 'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_z-XHpftdXEE',
          videoId: 'z-XHpftdXEE',
          title: 'Satu Bulan',
          artist: 'Bernadya',
          album: 'Sialnya, Hidup Harus Tetap Berjalan',
          duration: 201,
          image: 'https://yt3.googleusercontent.com/Uf_KmzeaQQa2N8Ep9thCOc8sPPvaF-3J4F58JkK4xEbQrmiy8u63oeNJ7RxV6n0FGQHTs4EncmgFeMA=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_xTQvdE1oOaw',
          videoId: 'xTQvdE1oOaw',
          title: 'Rumah Ke Rumah',
          artist: 'Hindia',
          album: 'Menari Dengan Bayangan',
          duration: 278,
          image: 'https://yt3.googleusercontent.com/7oX7kccOMbD9v7SqDbSwHHoLQogdM1QWPyfSaeCUD9FMFj8pJK9dXYdR7bM8hH9S8bGWH2IXnLFtuGdx=w600-h600-l90-rj',
          source: 'youtube'
        }
      ],
      newReleases: [
        {
          id: 'yt_D0fzGl640wE',
          videoId: 'D0fzGl640wE',
          title: 'Jangan Paksa Rindu (Beda)',
          artist: 'Ifan Seventeen',
          album: 'New Release',
          duration: 246,
          image: 'https://yt3.googleusercontent.com/EhJCP_-PRh3_78t1fSouQ7D3mrBszq3mmXSc1JRxawuMr8C3Gq0bKC--XP1dXp4KW8UdLX09LXba8F4=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_rouojv6Xu8Q',
          videoId: 'rouojv6Xu8Q',
          title: 'Bahagia Lagi',
          artist: 'Piche Kota',
          album: 'New Release',
          duration: 228,
          image: 'https://yt3.googleusercontent.com/7ecjOVgSXJjNEQWLt-bZSyuUIIU5T9r5GYwvlQfKOH5sZ3AxGwzu-ZrY4R_7SENgv3Efobl9e2XDtkaJYQ=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_5F28ye50-Kc',
          videoId: '5F28ye50-Kc',
          title: 'Teh Hijau',
          artist: 'Tulus',
          album: 'New Release',
          duration: 213,
          image: 'https://yt3.googleusercontent.com/xrGDyYO3umAVFdsdyIM2G451xiAxCD6haJkCQel6TQlqE-XsEUCGsj_Q5Er4YjFpjWqv-_Ze-VaPPL0j=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_GsE-vio1nFg',
          videoId: 'GsE-vio1nFg',
          title: 'Bunga Maaf',
          artist: 'Rainsomn',
          album: 'New Release',
          duration: 108,
          image: 'https://yt3.googleusercontent.com/A83d3hUCiIJu2ZQNqaDKi4-I36sjYmt9PvkkqULmXu6z0jj4R2hELstrRIyriP5G5BRVBm37Tb3EgBquoA=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_Zq1Jg0H5fzc',
          videoId: 'Zq1Jg0H5fzc',
          title: 'everything u are',
          artist: 'Hindia',
          album: 'New Release',
          duration: 237,
          image: 'https://yt3.googleusercontent.com/pP42VdTGrlRG0oCRZdgwhZ57R6CpfWDtewbZ9Mlg6gNoKWAjY4R59sGt_Le_zdWHh6hpNeRobL8aBVxwVQ=w600-h600-l90-rj',
          source: 'youtube'
        }
      ],
      similarSections: [
        {
          artist: {
            name: 'Hindia',
            artistId: 'UCzhVLh7xVyH3MpqO_KY6SYg',
            image: 'https://yt3.googleusercontent.com/8ImMAMQSD4FA6-gdqCZWSFaB-drHvkdfiFcFAk7Mcyy56ctfWD-Xxno-CHfGC4L6Ql8aR61XT0vX0F4b=w300-h300-l90-rj'
          },
          tracks: [
            {
              id: 'yt_Zq1Jg0H5fzc',
              videoId: 'Zq1Jg0H5fzc',
              title: 'everything u are',
              artist: 'Hindia',
              album: 'Single',
              duration: 237,
              image: 'https://yt3.googleusercontent.com/pP42VdTGrlRG0oCRZdgwhZ57R6CpfWDtewbZ9Mlg6gNoKWAjY4R59sGt_Le_zdWHh6hpNeRobL8aBVxwVQ=w600-h600-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_xTQvdE1oOaw',
              videoId: 'xTQvdE1oOaw',
              title: 'Rumah Ke Rumah',
              artist: 'Hindia',
              album: 'Menari Dengan Bayangan',
              duration: 278,
              image: 'https://yt3.googleusercontent.com/7oX7kccOMbD9v7SqDbSwHHoLQogdM1QWPyfSaeCUD9FMFj8pJK9dXYdR7bM8hH9S8bGWH2IXnLFtuGdx=w600-h600-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_RtK4E61x3Fs',
              videoId: 'RtK4E61x3Fs',
              title: 'Cincin',
              artist: 'Hindia',
              album: 'Lagipula Hidup Akan Berakhir',
              duration: 267,
              image: 'https://yt3.googleusercontent.com/xW7gjujQQNi_Z6H0gJmwjH5YL76qUcalIcPBV9_q1kvzxmA5fG7HIPKYS3tl64O6KVEFu8lklMy31yPi=w600-h600-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_Db4cJuoltKA',
              videoId: 'Db4cJuoltKA',
              title: 'Secukupnya',
              artist: 'Hindia',
              album: 'Menari Dengan Bayangan',
              duration: 209,
              image: 'https://yt3.googleusercontent.com/WSpsIaJvsMch8kEAf7sKTXFbXjqkc8kTSbSd162JGfsRDiV8uzUjw0CXJ5_J_SFkWV3cefIAXibshq-w=w600-h600-l90-rj',
              source: 'youtube'
            }
          ]
        },
        {
          artist: {
            name: 'Nadin Amizah',
            artistId: 'UCZhZaUHxvz-cxWFhYaWKmtw',
            image: 'https://yt3.googleusercontent.com/1MrTMYk3XQeTy0EDkJOOkRaHwV2jo-8Es2y8ksOyDThn1btv3VrtzRJy8PbRzVY1V-xj9DBaELpR8jnS=w300-h300-l90-rj'
          },
          tracks: [
            {
              id: 'yt_vsIdtK8wQ4o',
              videoId: 'vsIdtK8wQ4o',
              title: 'Reservasi Untuk Dua',
              artist: 'Nadin Amizah',
              album: 'Untuk Dunia, Cinta, dan Kotornya',
              duration: 260,
              image: 'https://yt3.googleusercontent.com/ZTeVzkcAoQ7F8tA1D7JZw_27xBRpZB1Hm01x7DV3Uzr50tCpe_1sJhrfgpq8mPJAFtka1s-1ixfVN7o=w600-h600-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_9bZaxxlrzbI',
              videoId: '9bZaxxlrzbI',
              title: 'Di Akhir Perang',
              artist: 'Nadin Amizah',
              album: 'Untuk Dunia, Cinta, dan Kotornya',
              duration: 239,
              image: 'https://yt3.googleusercontent.com/v3ku0MqYM2jNGb1JwUVjYyk2Q5oyJJk89q3uk2zL-hKP6nzNPewk2kQO6Gj5mmw34CezkOmT0D_3c2_q=w600-h600-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_2A9Atl2hUkg',
              videoId: '2A9Atl2hUkg',
              title: 'Rayuan Perempuan Gila',
              artist: 'Nadin Amizah',
              album: 'Untuk Dunia, Cinta, dan Kotornya',
              duration: 320,
              image: 'https://yt3.googleusercontent.com/Xl6zZocmFH7MptYEXcz_Qo_DjI0XwUTtFKgr2TXs4JpO-2RmOQ4Ces1hjZc1_sQSmLtFJH_558Q2UxYF=w600-h600-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_P6W5-GqE0bM',
              videoId: 'P6W5-GqE0bM',
              title: 'Bertaut',
              artist: 'Nadin Amizah',
              album: 'Selamat Ulang Tahun',
              duration: 315,
              image: 'https://yt3.googleusercontent.com/1MrTMYk3XQeTy0EDkJOOkRaHwV2jo-8Es2y8ksOyDThn1btv3VrtzRJy8PbRzVY1V-xj9DBaELpR8jnS=w600-h600-l90-rj',
              source: 'youtube'
            }
          ]
        },
        {
          artist: {
            name: 'Ryuuuchiee',
            image: 'https://yt3.googleusercontent.com/zaCnVX8O_57YEkbUqALSYB8bBfnIeA-i6wMDqzapiD1HonC0tTT2wOLUlksTNaOX8o_3UNWp15I4zJw=w300-h300-l90-rj'
          },
          tracks: [
            {
              id: 'yt_benz_promo',
              videoId: 'tC9TKJ0A4-s',
              title: 'enz - Character Promo',
              artist: 'Think Music India',
              album: 'Promo',
              duration: 180,
              image: 'https://yt3.googleusercontent.com/zaCnVX8O_57YEkbUqALSYB8bBfnIeA-i6wMDqzapiD1HonC0tTT2wOLUlksTNaOX8o_3UNWp15I4zJw=w600-h600-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_thodi_daaru',
              videoId: '5QMsYmJYUlQ',
              title: 'Thodi Si Daaru',
              artist: 'AP Dhillon',
              album: 'Two Hearts Never Break The Same',
              duration: 215,
              image: 'https://yt3.googleusercontent.com/CNJzI56YM9Lm4CfscfWmLiBcF_vWhNpXKZpfAjLEiELf2eDIY-YvM0vPXMNUxmwJNtWeRqUJyxi-4DpO=w600-h600-l90-rj',
              source: 'youtube'
            },
            {
              id: 'yt_aankhon_se',
              videoId: 'EhJCP_-PRh3',
              title: 'Aankhon Se',
              artist: 'Lijo George',
              album: 'Single',
              duration: 198,
              image: 'https://yt3.googleusercontent.com/EhJCP_-PRh3_78t1fSouQ7D3mrBszq3mmXSc1JRxawuMr8C3Gq0bKC--XP1dXp4KW8UdLX09LXba8F4=w600-h600-l90-rj',
              source: 'youtube'
            }
          ]
        }
      ],
      viralTikTok: [
        {
          id: 'yt_k3-FWnkfi9U',
          videoId: 'k3-FWnkfi9U',
          title: 'Cinta Merah Jambu (feat. Ajeng)',
          artist: 'LEK PANG',
          album: 'TikTok Viral',
          duration: 421,
          image: 'https://yt3.googleusercontent.com/2DFdnJvXYt7FfFPkk1QvHvBod-IaiqYALpwKRHv71pxxgqZSkWtGwxvyiYKVyLRXgeSKFx_Z1LVEhm5o=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_9ZR4G6CqqQA',
          videoId: '9ZR4G6CqqQA',
          title: 'TABOLA BALE',
          artist: 'SILET OPEN UP',
          album: 'TikTok Viral',
          duration: 275,
          image: 'https://yt3.googleusercontent.com/HxJjyBXxR_eG32d-QKwLjMj7aDovmaEjPhuJdJSdT4Kna0WdvvgpZeUKsYafrIYABXkOfayg1GxBBHWg=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_UF4j7r2jV50',
          videoId: 'UF4j7r2jV50',
          title: 'Nan Ko Paham',
          artist: 'Maman Fvndy',
          album: 'TikTok Viral',
          duration: 262,
          image: 'https://yt3.googleusercontent.com/v-Yva-v00WWGjxsQg92IAzDoVzLzCdXcv4Ivk_JyBYAAaW8SPv_K6HxmULloruhq0hfnt05g4dxtOMnR=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_lABZ_-uhC0E',
          videoId: 'lABZ_-uhC0E',
          title: 'Gala bunga matahari',
          artist: 'Sal Priadi',
          album: 'Viral',
          duration: 210,
          image: 'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_z-XHpftdXEE',
          videoId: 'z-XHpftdXEE',
          title: 'Satu Bulan',
          artist: 'Bernadya',
          album: 'Viral',
          duration: 201,
          image: 'https://yt3.googleusercontent.com/Uf_KmzeaQQa2N8Ep9thCOc8sPPvaF-3J4F58JkK4xEbQrmiy8u63oeNJ7RxV6n0FGQHTs4EncmgFeMA=w600-h600-l90-rj',
          source: 'youtube'
        }
      ],
      feelGoodRock: [
        {
          id: 'yt_tC9TKJ0A4-s',
          videoId: 'tC9TKJ0A4-s',
          title: 'PURNAMA MERINDU',
          artist: 'VOLTROCK',
          album: 'Feel-good rock',
          duration: 263,
          image: 'https://yt3.googleusercontent.com/zaCnVX8O_57YEkbUqALSYB8bBfnIeA-i6wMDqzapiD1HonC0tTT2wOLUlksTNaOX8o_3UNWp15I4zJw=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_cVf4krniHoI',
          videoId: 'cVf4krniHoI',
          title: 'Rasa Yang Tertinggal | Rock cover',
          artist: 'Airo metal Suara',
          album: 'Feel-good rock',
          duration: 343,
          image: 'https://yt3.googleusercontent.com/ZL0fXeJNoOS1FXEZyvyCM12WUiwh7oAh4LGS7XaS-dl202cKmuZVhoMeT0SWlNnQ2NZx2is6q7XYD6Y=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_Lw17JMX-ILk',
          videoId: 'Lw17JMX-ILk',
          title: 'Sahabat Jadi Cinta',
          artist: 'Zigaz',
          album: 'Feel-good rock',
          duration: 236,
          image: 'https://yt3.googleusercontent.com/XFcbW_Rnikz2-zJDhGnGRuaKG5pW0fJUMKlDmtpTwe2dnOCoPAVT_oc3evmzSJs4YYVD1hmcIeN6UlM=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_5QMsYmJYUlQ',
          videoId: '5QMsYmJYUlQ',
          title: 'Seberapa Pantas',
          artist: 'Sheila On 7',
          album: '07 Des',
          duration: 234,
          image: 'https://yt3.googleusercontent.com/CNJzI56YM9Lm4CfscfWmLiBcF_vWhNpXKZpfAjLEiELf2eDIY-YvM0vPXMNUxmwJNtWeRqUJyxi-4DpO=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_xTQvdE1oOaw',
          videoId: 'xTQvdE1oOaw',
          title: 'Kangen',
          artist: 'Dewa 19',
          album: 'Format Masa Depan',
          duration: 330,
          image: 'https://yt3.googleusercontent.com/7oX7kccOMbD9v7SqDbSwHHoLQogdM1QWPyfSaeCUD9FMFj8pJK9dXYdR7bM8hH9S8bGWH2IXnLFtuGdx=w600-h600-l90-rj',
          source: 'youtube'
        }
      ],
      acousticChill: [
        {
          id: 'yt_kO1gvHp52l0',
          videoId: 'kO1gvHp52l0',
          title: 'Hours Relaxing Guitar Music',
          artist: 'Nature Sounds',
          album: 'Acoustic Chill',
          duration: 320,
          image: 'https://yt3.googleusercontent.com/bZgWdInM3xKZx_emk54joskFOprxdCHBx6s-vqZoT29vR9aN8Mw4squpT0_1UMa0lPnbeuXkV9PCxycw=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt__eDXK2OSYog',
          videoId: '_eDXK2OSYog',
          title: 'Morning Café Jazz',
          artist: 'Jazz Music Zone',
          album: 'Acoustic Chill',
          duration: 238,
          image: 'https://yt3.googleusercontent.com/ryOGtcqThn-ejc6h_77NLWuSoSnPypGexHu5EPBxUBN-nienIucOcXjZ55pok4w296sNdvx5Wf4u7DA=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_Gy52Ah-gRm8',
          videoId: 'Gy52Ah-gRm8',
          title: 'Kekasih Bayangan',
          artist: 'Felix Irwan',
          album: 'Acoustic Chill',
          duration: 330,
          image: 'https://yt3.googleusercontent.com/AOuv6LngN-Jx9yPFbaLe_qNeOrMAB5L2k2UXUsCFbFxD0xfy_SIPxSIlUBb22bBIm_Lp8rOKNstHnDc=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_5F28ye50-Kc',
          videoId: '5F28ye50-Kc',
          title: 'Monokrom (Acoustic)',
          artist: 'Tulus',
          album: 'Monokrom',
          duration: 213,
          image: 'https://yt3.googleusercontent.com/xrGDyYO3umAVFdsdyIM2G451xiAxCD6haJkCQel6TQlqE-XsEUCGsj_Q5Er4YjFpjWqv-_Ze-VaPPL0j=w600-h600-l90-rj',
          source: 'youtube'
        }
      ],
      eidGetaways: [
        {
          id: 'yt_ziyFx-INaao',
          videoId: 'ziyFx-INaao',
          title: 'Aidin Wal Faizin',
          artist: 'Tasya Kamila',
          album: 'Ketupat Lebaran',
          duration: 235,
          image: 'https://yt3.googleusercontent.com/d72V_46HZ9hEPvLupkV3ikyPb2Li9YD_vXbDfjhc6Gc5Dtk6erTUD9h1QNz9Kw-HL2uL1FLNmRWkRjjN=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_fRPwMI7YwGg',
          videoId: 'fRPwMI7YwGg',
          title: 'Idul Fitri',
          artist: 'Gita Gutawa',
          album: 'Balada Shalawat',
          duration: 216,
          image: 'https://yt3.googleusercontent.com/yGKhnJ6yxQt-akw3VbG9UtcXZZEnlcGKC-5wF6EogmszGf_MY1Hl4dvjkU5VarP3_4phiT8DILgnpMtM=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_ECMxOUCOWGw',
          videoId: 'ECMxOUCOWGw',
          title: 'Selamat Lebaran',
          artist: 'UNGU',
          album: 'SurgaMu',
          duration: 243,
          image: 'https://yt3.googleusercontent.com/9BN6TQ82eHDsj80eyXPsMlo7fJq1EfeVxh4yb8p89Cyedlfa6jv5ZXBaB_4jYvqlAa0sREnsOz9vW71t=w600-h600-l90-rj',
          source: 'youtube'
        },
        {
          id: 'yt_dengan_nafasmu',
          videoId: 'lABZ_-uhC0E',
          title: 'Dengan Nafas-Mu',
          artist: 'Ungu',
          album: 'SurgaMu',
          duration: 260,
          image: 'https://yt3.googleusercontent.com/CnRlHvII5qQcoLQ8XW3_0b7qOLpBaDFtrCR-rQaCyKyQxuycqhLUc1PatxRtYFiEpDzZyzWqE1wdO0l9Cw=w600-h600-l90-rj',
          source: 'youtube'
        }
      ]
    };

    res.json(homeSectionsData);
  } catch (err) {
    console.error('Error serving /api/home-sections:', err);
    res.status(500).json({ error: 'Failed to load home sections' });
  }
});

// Dedicated Genre & Mood API endpoint (fetches real songs from risyadh / YouTube scraper)
const genreDataCache: Record<string, { data: any; timestamp: number }> = {};

app.get('/api/genre', async (req, res) => {
  const genre = ((req.query.genre || req.query.name || 'Chill') as string).trim();
  const cacheKey = genre.toLowerCase();
  const now = Date.now();

  if (genreDataCache[cacheKey] && now - genreDataCache[cacheKey].timestamp < 600000) {
    return res.json(genreDataCache[cacheKey].data);
  }

  try {
    const feelingQuery = `feeling ${genre} music`;
    const hitsQuery = `${genre} hits songs`;
    const popQuery = `best of ${genre} playlist`;

    const fetchTracks = async (q: string) => {
      const ytUrl = `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(q)}&type=song`;
      const ytRes = await fetch(ytUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      }).then((r) => (r.ok ? r.json() : [])).catch(() => []);

      if (!Array.isArray(ytRes)) return [];
      return ytRes
        .filter((item: any) => item.videoId || (item.type === 'SONG' && item.id))
        .map((item: any) => {
          const vId = item.videoId || item.id;
          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
          }
          if (!bestThumb) {
            bestThumb = `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;
          }
          return {
            id: `yt_${vId}`,
            videoId: vId,
            title: (item.name || item.title || '').trim(),
            name: (item.name || item.title || '').trim(),
            artist: typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || 'Artis',
            album: item.album?.name || `${genre} Collection`,
            duration: typeof item.duration === 'number' ? item.duration : 210,
            image: bestThumb,
            source: 'youtube'
          };
        });
    };

    const [feelingTracks, hitTracks, moreTracks] = await Promise.all([
      fetchTracks(feelingQuery),
      fetchTracks(hitsQuery),
      fetchTracks(popQuery),
    ]);

    const result = {
      genre,
      feelingTitle: `Feeling ${genre.toLowerCase()}`,
      hitsTitle: `${genre} hits`,
      feelingTracks: feelingTracks.length > 0 ? feelingTracks.slice(0, 15) : [],
      hitTracks: hitTracks.length > 0 ? hitTracks.slice(0, 15) : [],
      moreTracks: moreTracks.length > 0 ? moreTracks.slice(0, 15) : [],
    };

    genreDataCache[cacheKey] = { data: result, timestamp: now };
    res.json(result);
  } catch (err) {
    console.error('Error in /api/genre:', err);
    res.status(500).json({ error: 'Failed to fetch genre data' });
  }
});

// Community / Full Playlist Songs Cache
const communityPlaylistSongsCache: Record<string, { data: any[]; timestamp: number }> = {};

// Endpoint to fetch up to 100 authentic songs for From the community / any playlist
app.get('/api/community-playlist-songs', async (req, res) => {
  const id = (req.query.id as string || '').trim();
  const title = (req.query.title as string || '').trim();
  const cacheKey = `${id}_${title}`.toLowerCase();
  const now = Date.now();

  if (communityPlaylistSongsCache[cacheKey] && now - communityPlaylistSongsCache[cacheKey].timestamp < 600000) {
    return res.json(communityPlaylistSongsCache[cacheKey].data);
  }

  try {
    let searchQueries = ['lagu indonesia populer', 'pop indonesia terbaik', 'lagu mellow indonesia', 'lagu galau terpopuler'];
    if (title.toLowerCase().includes('chill') || id === 'comm_1') {
      searchQueries = ['chill songs spotify', 'chill pop indonesia', 'indie chill indonesia', 'acoustic chill', 'lagu santai indonesia'];
    } else if (title.toLowerCase().includes('close') || id === 'comm_2') {
      searchQueries = ['pop hits indonesia', 'lagu romantis indonesia', 'lagu galau indonesia', 'populer indonesia', 'lagu viral tiktok indonesia'];
    } else if (title.toLowerCase().includes('indie') || title.toLowerCase().includes('senja') || id === 'comm_3') {
      searchQueries = ['indie indonesia', 'lagu senja indonesia', 'hindia sal priadi nadin amizah', 'indie pop indonesia', 'lagu sore senja'];
    } else if (title) {
      searchQueries = [title, `${title} lagu`, 'top indonesia songs', 'lagu pop indonesia'];
    }

    const allSongs: any[] = [];
    const seenIds = new Set<string>();

    for (const query of searchQueries) {
      if (allSongs.length >= 100) break;
      const ytUrl = `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(query)}&type=song`;
      const ytRes = await fetch(ytUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      }).then(r => (r.ok ? r.json() : [])).catch(() => []);

      if (Array.isArray(ytRes)) {
        for (const item of ytRes) {
          const videoId = item.videoId || (item.type === 'SONG' ? item.id : null);
          if (!videoId || seenIds.has(videoId)) continue;

          const t = (item.name || item.title || '').trim();
          const a = typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || 'Artis';
          const dur = typeof item.duration === 'number' ? item.duration : 210;
          if (dur > 540) continue;

          seenIds.add(videoId);
          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
          }
          if (!bestThumb) {
            bestThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          }

          allSongs.push({
            id: `yt_${videoId}`,
            videoId,
            title: t,
            name: t,
            artist: a,
            artists: a,
            album: item.album?.name || title || 'Playlist Komunitas',
            duration: dur,
            image: bestThumb,
            source: 'youtube',
          });

          if (allSongs.length >= 100) break;
        }
      }
    }

    if (allSongs.length > 0) {
      communityPlaylistSongsCache[cacheKey] = { data: allSongs, timestamp: now };
      return res.json(allSongs);
    }

    return res.json([]);
  } catch (err) {
    console.error('Error fetching community playlist songs:', err);
    res.json([]);
  }
});

// Upnext queue endpoint
app.get('/api/upnext', async (req, res) => {
  const id = (req.query.id as string || '').trim();
  if (!id) {
    return res.status(400).json({ error: 'ID required' });
  }

  try {
    const upRes = await fetch(`https://risyadh-musik.vercel.app/api/upnext?id=${encodeURIComponent(id)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then(r => (r.ok ? r.json() : null)).catch(() => null);

    if (Array.isArray(upRes)) {
      return res.json(upRes);
    }
    res.json([]);
  } catch {
    res.json([]);
  }
});

// In-memory lyrics cache
const lyricsCache = new Map<string, any>();

function cleanTrackNameForLyrics(title: string): string {
  return title
    .replace(/\s*[\(\[](official\s*(music\s*)?video|audio|lyric(s)?(\s*video)?|mv|visualizer|remastered|live|cover|hd|4k|ft\.|feat\.)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s*-\s*(official\s*(music\s*)?video|audio|lyric(s)?|mv).*/gi, '')
    .replace(/\s*\|\s*.*/gi, '')
    .replace(/^\s*\d+[\.\s-]+/, '')
    .trim();
}

async function findLrcLibLyrics(rawTitle: string, rawArtist: string, duration?: number): Promise<any | null> {
  let cleanTitle = cleanTrackNameForLyrics(rawTitle);
  let cleanArtist = (rawArtist || '').trim();

  // If title has "Artist - Title", split
  if (cleanTitle.includes(' - ')) {
    const parts = cleanTitle.split(' - ');
    if (!cleanArtist || cleanArtist === 'Artis' || cleanArtist === 'YouTube Music') {
      cleanArtist = parts[0].trim();
    }
    cleanTitle = parts.slice(1).join(' - ').trim();
  }

  // Clean artist names (take primary artist before commas or feat)
  const primaryArtist = cleanArtist
    .split(',')[0]
    .split('&')[0]
    .replace(/feat\..*/i, '')
    .trim();

  const headers = { 'User-Agent': 'ShawnMusic/2.0 (contact@shawnmusic.app)' };

  // 1. Direct GET by exact artist + track name
  if (cleanTitle && primaryArtist) {
    const durParam = duration && duration > 0 ? `&duration=${Math.round(duration)}` : '';
    const directUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(primaryArtist)}&track_name=${encodeURIComponent(cleanTitle)}${durParam}`;
    const directRes = await fetch(directUrl, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (directRes && (directRes.syncedLyrics || directRes.plainLyrics)) {
      return directRes;
    }
  }

  // 2. Search by track_name and artist_name
  if (cleanTitle) {
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}${primaryArtist ? `&artist_name=${encodeURIComponent(primaryArtist)}` : ''}`;
    const searchRes = await fetch(searchUrl, { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
    if (Array.isArray(searchRes) && searchRes.length > 0) {
      const withSynced = searchRes.find((item: any) => item.syncedLyrics);
      if (withSynced) return withSynced;
      if (searchRes[0].plainLyrics) return searchRes[0];
    }
  }

  // 3. Search by query string (artist + title)
  if (cleanTitle) {
    const query = primaryArtist ? `${primaryArtist} ${cleanTitle}` : cleanTitle;
    const qSearchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
    const qSearchRes = await fetch(qSearchUrl, { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
    if (Array.isArray(qSearchRes) && qSearchRes.length > 0) {
      const withSynced = qSearchRes.find((item: any) => item.syncedLyrics);
      if (withSynced) return withSynced;
      if (qSearchRes[0].plainLyrics) return qSearchRes[0];
    }
  }

  // 4. Fallback search by title only
  if (cleanTitle && cleanTitle.length > 3) {
    const titleOnlyUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`;
    const titleOnlyRes = await fetch(titleOnlyUrl, { headers }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
    if (Array.isArray(titleOnlyRes) && titleOnlyRes.length > 0) {
      const withSynced = titleOnlyRes.find((item: any) => item.syncedLyrics);
      if (withSynced) return withSynced;
      if (titleOnlyRes[0].plainLyrics) return titleOnlyRes[0];
    }
  }

  return null;
}

// Upnext / lyrics endpoint (prioritizes high-precision LRC timestamps)
app.get('/api/lyrics', async (req, res) => {
  const id = (req.query.id as string || '').trim();
  const artist = (req.query.artist as string || '').trim();
  const title = (req.query.title as string || '').trim();
  const dur = req.query.duration ? parseFloat(req.query.duration as string) : undefined;

  const cacheKey = `${id}_${artist}_${title}`.toLowerCase();
  if (lyricsCache.has(cacheKey)) {
    return res.json(lyricsCache.get(cacheKey));
  }

  try {
    // 1. Primary priority: LRCLIB for time-synchronized lyrics (LRC timestamps matching vocal speech)
    if (title) {
      const lrcData = await findLrcLibLyrics(title, artist, dur);
      if (lrcData && (lrcData.syncedLyrics || lrcData.plainLyrics)) {
        const lines = (lrcData.plainLyrics || '').split('\n').filter(Boolean);
        const result = {
          lyrics: lines,
          plainLyrics: lrcData.plainLyrics || null,
          syncedLyrics: lrcData.syncedLyrics || null,
          instrumental: lrcData.instrumental || false,
          duration: lrcData.duration || null,
        };
        lyricsCache.set(cacheKey, result);
        return res.json(result);
      }
    }

    // 2. Secondary fallback: YouTube Music plain lyrics
    if (id) {
      const ytLyrics = await fetch(`https://risyadh-musik.vercel.app/api/lyrics?id=${encodeURIComponent(id)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }).then(r => (r.ok ? r.json() : null)).catch(() => null);

      if (ytLyrics?.lyrics && Array.isArray(ytLyrics.lyrics) && ytLyrics.lyrics.length > 0) {
        const result = {
          lyrics: ytLyrics.lyrics,
          plainLyrics: ytLyrics.lyrics.join('\n'),
          syncedLyrics: null,
          instrumental: false,
        };
        lyricsCache.set(cacheKey, result);
        return res.json(result);
      }
    }

    const emptyResult = { lyrics: [], plainLyrics: null, syncedLyrics: null };
    lyricsCache.set(cacheKey, emptyResult);
    res.json(emptyResult);
  } catch {
    res.json({ lyrics: [], plainLyrics: null, syncedLyrics: null });
  }
});

// Top Indonesia endpoint
let topIndonesiaCache: { data: any[]; timestamp: number } | null = null;
app.get('/api/top-indonesia', async (req, res) => {
  const now = Date.now();
  if (topIndonesiaCache && now - topIndonesiaCache.timestamp < 600000 && topIndonesiaCache.data.length > 0) {
    return res.json(topIndonesiaCache.data);
  }

  try {
    const queries = ['top hits indonesia', 'lagu indonesia populer', 'bernadya', 'sal priadi', 'mahalini', 'hindia'];
    const results = await Promise.allSettled(
      queries.map(q =>
        fetch(`https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(q)}&type=song`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }).then(r => (r.ok ? r.json() : []))
      )
    );

    const seenIds = new Set<string>();
    const songs: any[] = [];

    for (const resItem of results) {
      if (resItem.status === 'fulfilled' && Array.isArray(resItem.value)) {
        for (const item of resItem.value) {
          const videoId = item.videoId || (item.type === 'SONG' ? item.id : null);
          if (!videoId || seenIds.has(videoId)) continue;

          const title = (item.name || item.title || '').trim();
          const artist = (typeof item.artist === 'string' ? item.artist : item.artist?.name || item.artists || 'Artis').trim();
          const combined = `${title} ${artist}`.toLowerCase();

          if (
            /jugo muzik/i.test(combined) ||
            /kompilasi/i.test(combined) ||
            /kumpulan/i.test(combined) ||
            /full album/i.test(combined) ||
            /terbaik tahun/i.test(combined) ||
            /1 jam/i.test(combined) ||
            /2 jam/i.test(combined)
          ) {
            continue;
          }

          const dur = typeof item.duration === 'number' ? item.duration : 0;
          if (dur > 540) continue;

          seenIds.add(videoId);

          let bestThumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
          }
          if (!bestThumb) {
            bestThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          }

          songs.push({
            id: `yt_${videoId}`,
            videoId,
            title,
            name: title,
            artist,
            artists: artist,
            album: item.album?.name || 'Top 50 Indonesia',
            duration: item.duration || 210,
            image: bestThumb,
            source: 'youtube',
          });

          if (songs.length >= 50) break;
        }
      }
      if (songs.length >= 50) break;
    }

    if (songs.length > 0) {
      topIndonesiaCache = { data: songs, timestamp: now };
      return res.json(songs);
    }
    return res.json([]);
  } catch (err) {
    console.error('Error in /api/top-indonesia:', err);
    res.json([]);
  }
});

// Artist endpoint
app.get('/api/artist', async (req, res) => {
  let id = (req.query.id as string || '').trim();
  const name = (req.query.name as string || '').trim();

  try {
    let artistName = name;

    // If no valid UC ID provided, search artist by name or id
    if (!id || !id.startsWith('UC')) {
      const searchTerm = name || id;
      if (!searchTerm) {
        return res.status(400).json({ error: 'Artist ID or Name required' });
      }

      const sRes = await fetch(`https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(searchTerm)}&type=artist`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }).then(r => (r.ok ? r.json() : null)).catch(() => null);

      if (Array.isArray(sRes) && sRes.length > 0 && sRes[0].artistId) {
        id = sRes[0].artistId;
        artistName = sRes[0].name || artistName || searchTerm;
      } else {
        // Fallback: search comprehensive songs for this artist
        artistName = searchTerm;
        const songQueries = [
          `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(searchTerm)}&type=song`,
          `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(searchTerm + ' lagu')}&type=song`,
          `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(searchTerm + ' popular')}&type=song`,
          `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(searchTerm + ' official')}&type=song`,
        ];

        const resLists = await Promise.all(
          songQueries.map(url =>
            fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
              .then(r => (r.ok ? r.json() : []))
              .catch(() => [])
          )
        );

        const seen = new Set<string>();
        const allSongs: any[] = [];
        for (const list of resLists) {
          if (Array.isArray(list)) {
            for (const s of list) {
              const vid = s.videoId || s.id;
              if (vid && !seen.has(vid)) {
                seen.add(vid);
                let thumb = s.thumbnails?.[s.thumbnails.length - 1]?.url || s.thumbnail;
                if (thumb && thumb.includes('googleusercontent.com')) {
                  thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
                }
                allSongs.push({
                  ...s,
                  id: `yt_${vid}`,
                  videoId: vid,
                  title: s.name || s.title,
                  name: s.name || s.title,
                  artist: typeof s.artist === 'string' ? s.artist : s.artist?.name || searchTerm,
                  album: s.album?.name || s.album || 'Single',
                  duration: typeof s.duration === 'number' ? s.duration : 200,
                  image: thumb || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                });
              }
            }
          }
        }

        return res.json({
          type: 'ARTIST',
          artistId: id || 'art_' + encodeURIComponent(searchTerm),
          name: searchTerm,
          thumbnails: [{ url: allSongs[0]?.image || `https://i.ytimg.com/vi/${allSongs[0]?.videoId || 'default'}/hqdefault.jpg`, width: 600, height: 600 }],
          topSongs: allSongs,
          topAlbums: [],
          topSingles: [],
        });
      }
    }

    const aRes = await fetch(`https://risyadh-musik.vercel.app/api/artist?id=${encodeURIComponent(id)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then(r => (r.ok ? r.json() : null)).catch(() => null);

    if (aRes) {
      artistName = aRes.name || artistName || name || id;

      // Enhance initial topSongs thumbnails
      const initialTopSongs: any[] = [];
      if (Array.isArray(aRes.topSongs)) {
        for (const s of aRes.topSongs) {
          let bestThumb = s.thumbnails?.[s.thumbnails.length - 1]?.url || s.thumbnail;
          if (bestThumb && bestThumb.includes('googleusercontent.com')) {
            bestThumb = bestThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
          }
          if (!bestThumb && s.videoId) {
            bestThumb = `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`;
          }
          initialTopSongs.push({
            ...s,
            id: s.videoId ? `yt_${s.videoId}` : s.id,
            title: s.name || s.title,
            name: s.name || s.title,
            artist: typeof s.artist === 'string' ? s.artist : s.artist?.name || artistName,
            album: typeof s.album === 'string' ? s.album : s.album?.name || 'Single',
            image: bestThumb,
          });
        }
      }

      // Concurrently collect all songs by artist across various search variants and discography
      const searchQueries = [
        `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(artistName)}&type=song`,
        `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(artistName + ' lagu')}&type=song`,
        `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(artistName + ' popular')}&type=song`,
        `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(artistName + ' official')}&type=song`,
      ];

      // Add album search queries for the artist
      if (Array.isArray(aRes.topAlbums)) {
        for (const alb of aRes.topAlbums.slice(0, 4)) {
          if (alb.name) {
            searchQueries.push(
              `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(artistName + ' ' + alb.name)}&type=song`
            );
          }
        }
      }

      // Add single search queries for the artist
      if (Array.isArray(aRes.topSingles)) {
        for (const sng of aRes.topSingles.slice(0, 4)) {
          if (sng.name) {
            searchQueries.push(
              `https://risyadh-musik.vercel.app/api/search?q=${encodeURIComponent(artistName + ' ' + sng.name)}&type=song`
            );
          }
        }
      }

      const searchResults = await Promise.all(
        searchQueries.map(url =>
          fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
            .then(r => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      );

      const existingIds = new Set<string>();
      const combinedSongs: any[] = [];

      // 1. First add initial topSongs
      for (const s of initialTopSongs) {
        const vid = s.videoId || s.id;
        if (vid && !existingIds.has(vid)) {
          existingIds.add(vid);
          combinedSongs.push(s);
        }
      }

      // 2. Add songs from all queries
      for (const resList of searchResults) {
        if (Array.isArray(resList)) {
          for (const item of resList) {
            const vid = item.videoId || item.id;
            if (vid && !existingIds.has(vid)) {
              let thumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || item.thumbnail;
              if (thumb && thumb.includes('googleusercontent.com')) {
                thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
              }
              existingIds.add(vid);
              combinedSongs.push({
                ...item,
                id: `yt_${vid}`,
                videoId: vid,
                title: item.name || item.title,
                name: item.name || item.title,
                artist: typeof item.artist === 'string' ? item.artist : item.artist?.name || artistName,
                album: item.album?.name || item.album || 'Single',
                duration: typeof item.duration === 'number' ? item.duration : 200,
                image: thumb || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
              });
            }
          }
        }
      }

      // 3. Add topVideos as playable tracks if not already present
      if (Array.isArray(aRes.topVideos)) {
        for (const v of aRes.topVideos) {
          if (v.videoId && !existingIds.has(v.videoId)) {
            let thumb = v.thumbnails?.[v.thumbnails.length - 1]?.url || v.thumbnail;
            existingIds.add(v.videoId);
            combinedSongs.push({
              id: `yt_${v.videoId}`,
              videoId: v.videoId,
              title: v.name || v.title,
              name: v.name || v.title,
              artist: artistName,
              album: 'Official Video',
              duration: typeof v.duration === 'number' ? v.duration : 220,
              image: thumb || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            });
          }
        }
      }

      aRes.topSongs = combinedSongs;

      // Enhance albums thumbnails and deduplicate
      if (Array.isArray(aRes.topAlbums)) {
        const seenAlbums = new Set<string>();
        aRes.topAlbums = aRes.topAlbums
          .filter((alb: any) => {
            const id = alb.albumId || alb.playlistId || alb.name;
            if (!id || seenAlbums.has(id)) return false;
            seenAlbums.add(id);
            return true;
          })
          .map((alb: any) => {
            let thumb = alb.thumbnails?.[alb.thumbnails.length - 1]?.url || alb.thumbnail;
            if (thumb && thumb.includes('googleusercontent.com')) {
              thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w500-h500-l90-rj');
            }
            return {
              ...alb,
              image: thumb,
              thumbnails: [{ url: thumb, width: 500, height: 500 }],
            };
          });
      }

      // Enhance singles thumbnails and deduplicate
      if (Array.isArray(aRes.topSingles)) {
        const seenSingles = new Set<string>();
        aRes.topSingles = aRes.topSingles
          .filter((s: any) => {
            const id = s.albumId || s.playlistId || s.name;
            if (!id || seenSingles.has(id)) return false;
            seenSingles.add(id);
            return true;
          })
          .map((s: any) => {
            let thumb = s.thumbnails?.[s.thumbnails.length - 1]?.url || s.thumbnail;
            if (thumb && thumb.includes('googleusercontent.com')) {
              thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w500-h500-l90-rj');
            }
            return {
              ...s,
              image: thumb,
              thumbnails: [{ url: thumb, width: 500, height: 500 }],
            };
          });
      }

      // Enhance similar artists thumbnails and deduplicate
      if (Array.isArray(aRes.similarArtists)) {
        const seenArtists = new Set<string>();
        aRes.similarArtists = aRes.similarArtists
          .filter((sim: any) => {
            const id = sim.artistId || sim.browseId || sim.name;
            if (!id || seenArtists.has(id)) return false;
            seenArtists.add(id);
            return true;
          })
          .map((sim: any) => {
            let thumb = sim.thumbnails?.[sim.thumbnails.length - 1]?.url || sim.thumbnail;
            if (thumb && thumb.includes('googleusercontent.com')) {
              thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w300-h300-p-l90-rj');
            }
            return {
              ...sim,
              image: thumb,
              thumbnails: [{ url: thumb, width: 300, height: 300 }],
            };
          });
      }

      // Deduplicate topVideos
      if (Array.isArray(aRes.topVideos)) {
        const seenVids = new Set<string>();
        aRes.topVideos = aRes.topVideos.filter((v: any) => {
          const id = v.videoId;
          if (!id || seenVids.has(id)) return false;
          seenVids.add(id);
          return true;
        });
      }

      // Enhance featuredOn playlists
      if (Array.isArray(aRes.featuredOn)) {
        aRes.featuredOn = aRes.featuredOn.map((pl: any) => {
          let thumb = pl.thumbnails?.[pl.thumbnails.length - 1]?.url || pl.thumbnail;
          if (thumb && thumb.includes('googleusercontent.com')) {
            thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w400-h400-l90-rj');
          }
          return {
            ...pl,
            image: thumb,
            thumbnails: [{ url: thumb, width: 400, height: 400 }],
          };
        });
      }

      return res.json(aRes);
    }
    res.status(404).json({ error: 'Artist not found' });
  } catch (e) {
    console.error('Error fetching artist:', e);
    res.status(500).json({ error: 'Failed to fetch artist' });
  }
});

// Popular Artists endpoint with working photos
app.get('/api/popular-artists', async (_req, res) => {
  const artists = [
    {
      name: 'Bernadya',
      artistId: 'UCUn9Xjvg8fwqpa58-_XO6zw',
      image: 'https://lh3.googleusercontent.com/hxROE1fvLWSxUYAFV3IgMp5vvjN91Jx6oS6uwSVyYN9_fb3I6PLaRa3Ufb4A0awxq4J5UoPFQAQM-Q=w300-h300-p-l90-rj',
    },
    {
      name: 'Sal Priadi',
      artistId: 'UCs1Iq1CQQDwTUUUtVhXmK6g',
      image: 'https://lh3.googleusercontent.com/wmItRT4hTCJrmnlsh_JBgOeBXww9mquXhrNR0oW3_hPW9LsZ5Z2grMij01EaENdt6ensOJfKm-OCBKqJ=w300-h300-p-l90-rj',
    },
    {
      name: 'Juicy Luicy',
      artistId: 'UCYBtTmBP2QgHgalgsv2v5LA',
      image: 'https://yt3.googleusercontent.com/DDebW5VciXI_oMRQC1cRIWlpDIWVaS8c_CbcCkf89YeHVziP9lkgA0xUZmmVRxGKmC3qmppuMtvIsa5U=w300-h300-p-l90-rj',
    },
    {
      name: 'Hindia',
      artistId: 'UCzhVLh7xVyH3MpqO_KY6SYg',
      image: 'https://yt3.googleusercontent.com/8ImMAMQSD4FA6-gdqCZWSFaB-drHvkdfiFcFAk7Mcyy56ctfWD-Xxno-CHfGC4L6Ql8aR61XT0vX0F4b=w300-h300-p-l90-rj',
    },
    {
      name: 'Mahalini',
      artistId: 'UCa1eYN7cwBQrOFQLt_K8c-Q',
      image: 'https://yt3.googleusercontent.com/VdgLqr3Sno_U1IXj9qzk43azloCsjBeDy6MpFjfD8kMmco0AeL81qow0cpHynDfpaVlujCY11O7QO4d6=w300-h300-p-l90-rj',
    },
    {
      name: 'Ghea Indrawari',
      artistId: 'UCWoBKSc1j2KkPd5j_f8Qfaw',
      image: 'https://lh3.googleusercontent.com/x0EJtjVijA3xtPZQejke6OMBfoBU7l6GY2j6LScOFFwIfm4x0ZVyhrN3pLaddKiM8yUA5EDFzu0krLg=w300-h300-p-l90-rj',
    },
    {
      name: 'Tulus',
      artistId: 'UC_DHlXllTSMB8pTC38_leFg',
      image: 'https://yt3.googleusercontent.com/h8P1jEIZLM8lkMxNA6Nbq98b43wcqllJSNmcZTCRPAB-F6rG_0Nqw5w7fwou0PN1QGwSW5viwWD5NV0=w300-h300-p-l90-rj',
    },
    {
      name: 'Nadhif Basalamah',
      artistId: 'UCbwAI7LydeNSRU-bywK0EHw',
      image: 'https://yt3.googleusercontent.com/jjFbDHc_GFI6lVSSRPGWMrh71fJ16iZYMccLFbkN_Jq6uR-QYXzgRwFDSuZeDpOuAbIIzNnPAPDZgAHv=w300-h300-p-l90-rj',
    },
    {
      name: 'XXXTentacion',
      artistId: 'UCnAcxgRZ065f_eXK1o85c1w',
      image: 'https://yt3.googleusercontent.com/No3I8pA9ows2dy6NElEr9mCXLzYxgjVvsQr7h69C03palsH1u8Q8iw-sAAUxav599Wmi64up8lbDGbI=w300-h300-p-l90-rj',
    },
  ];
  res.json(artists);
});

// YT Playlist endpoint
app.get('/api/ytplaylist', async (req, res) => {
  const id = (req.query.id as string || '').trim();
  if (!id) {
    return res.status(400).json({ error: 'Missing or invalid id' });
  }

  try {
    const plRes = await fetch(`https://risyadh-musik.vercel.app/api/ytplaylist?id=${encodeURIComponent(id)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    }).then(r => (r.ok ? r.json() : null)).catch(() => null);

    if (plRes) {
      return res.json(plRes);
    }
    res.status(404).json({ error: 'Playlist not found' });
  } catch {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// Search endpoint
app.get('/api/music/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ results: [] });
  }

  try {
    const results: SongItem[] = [];
    const seenIds = new Set<string>();

    // 1. Fetch from JioSaavn search & autocomplete
    const [autoRes, searchRes, audiusRes] = await Promise.all([
      fetch(`https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .catch(() => null),
      fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(query)}&p=1&n=25`)
        .then(r => r.json())
        .catch(() => null),
      fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=spotify_web_app`)
        .then(r => r.json())
        .catch(() => null),
    ]);

    // Parse direct songs from JioSaavn search.getResults
    if (searchRes?.results && Array.isArray(searchRes.results)) {
      for (const item of searchRes.results) {
        if (item.encrypted_media_url && !seenIds.has(item.id)) {
          const urls = decryptMediaUrl(item.encrypted_media_url);
          if (urls) {
            seenIds.add(item.id);
            results.push({
              id: `saavn_${item.id}`,
              title: cleanHtml(item.song),
              artist: cleanHtml(item.primary_artists || item.singers || item.music || 'Unknown Artist'),
              album: cleanHtml(item.album || 'Single'),
              duration: parseInt(item.duration, 10) || 180,
              image: (item.image || '').replace('150x150', '500x500').replace('50x50', '500x500'),
              streamUrl: urls.primaryUrl,
              quality320: urls.quality320,
              quality160: urls.quality160,
              source: 'saavn',
              year: item.year,
            });
          }
        }
      }
    }

    // Check autocomplete items to fetch details if needed
    const additionalPids: string[] = [];
    if (autoRes?.songs?.data && Array.isArray(autoRes.songs.data)) {
      for (const s of autoRes.songs.data) {
        if (s.id && !seenIds.has(s.id) && additionalPids.length < 15) {
          additionalPids.push(s.id);
        }
      }
    }
    if (autoRes?.albums?.data && Array.isArray(autoRes.albums.data)) {
      for (const alb of autoRes.albums.data) {
        if (alb.more_info?.song_pids) {
          const pids = alb.more_info.song_pids.split(',').map((p: string) => p.trim());
          for (const pid of pids) {
            if (pid && !seenIds.has(pid) && additionalPids.length < 15) {
              additionalPids.push(pid);
            }
          }
        }
      }
    }

    if (additionalPids.length > 0) {
      try {
        const detailsRes = await fetch(`https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0&_format=json&pids=${additionalPids.join(',')}`)
          .then(r => r.json())
          .catch(() => null);

        if (detailsRes && typeof detailsRes === 'object') {
          for (const key of Object.keys(detailsRes)) {
            const item = detailsRes[key];
            if (item?.encrypted_media_url && !seenIds.has(item.id)) {
              const urls = decryptMediaUrl(item.encrypted_media_url);
              if (urls) {
                seenIds.add(item.id);
                results.push({
                  id: `saavn_${item.id}`,
                  title: cleanHtml(item.song),
                  artist: cleanHtml(item.primary_artists || item.singers || item.music || 'Unknown Artist'),
                  album: cleanHtml(item.album || 'Single'),
                  duration: parseInt(item.duration, 10) || 180,
                  image: (item.image || '').replace('150x150', '500x500').replace('50x50', '500x500'),
                  streamUrl: urls.primaryUrl,
                  quality320: urls.quality320,
                  quality160: urls.quality160,
                  source: 'saavn',
                  year: item.year,
                });
              }
            }
          }
        }
      } catch {
        // Ignore details errors
      }
    }

    // Parse Audius tracks
    if (audiusRes?.data && Array.isArray(audiusRes.data)) {
      for (const track of audiusRes.data) {
        if (track.track_id && !seenIds.has(String(track.track_id))) {
          seenIds.add(String(track.track_id));
          const artwork = track.artwork?.['480x480'] || track.artwork?.['150x150'] || '';
          const stream = `https://discoveryprovider.audius.co/v1/tracks/${track.track_id}/stream?app_name=spotify_web_app`;
          results.push({
            id: `audius_${track.track_id}`,
            title: cleanHtml(track.title),
            artist: cleanHtml(track.user?.name || 'Audius Creator'),
            album: cleanHtml(track.genre || 'Single'),
            duration: Math.round(track.duration) || 180,
            image: artwork,
            streamUrl: stream,
            quality320: stream,
            quality160: stream,
            source: 'audius',
          });
        }
      }
    }

    res.json({ results });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search songs', message: err?.message });
  }
});

// Featured / Trending endpoint
app.get('/api/music/trending', async (_req, res) => {
  try {
    const defaultPlaylists = [
      { id: '1081991857', name: 'English Hit Songs', category: 'Hits Teratas' },
      { id: '280083933', name: "Let's Play - Taylor Swift", category: 'Artis Populer' },
      { id: '1079336813', name: 'Chill Maaro: Lo-Fi Mix', category: 'Santai & Chill' },
      { id: '63116930', name: 'English 2010s Nostalgia', category: 'Nostalgia' },
      { id: '106074413', name: "Let's Play - Queen", category: 'Rock Classics' },
    ];

    // Fetch popular tracks from the premier English Hit Songs playlist
    const playlistData = await fetch(
      'https://www.jiosaavn.com/api.php?__call=playlist.getDetails&_format=json&_marker=0&cc=in&includeMetaTags=1&listid=1081991857'
    )
      .then(r => r.json())
      .catch(() => null);

    const trendingSongs: SongItem[] = [];

    if (playlistData?.songs && Array.isArray(playlistData.songs)) {
      for (const item of playlistData.songs.slice(0, 20)) {
        if (item.encrypted_media_url) {
          const urls = decryptMediaUrl(item.encrypted_media_url);
          if (urls) {
            trendingSongs.push({
              id: `saavn_${item.id}`,
              title: cleanHtml(item.song),
              artist: cleanHtml(item.primary_artists || item.singers || item.music || 'Artist'),
              album: cleanHtml(item.album || 'Hits'),
              duration: parseInt(item.duration, 10) || 200,
              image: (item.image || '').replace('150x150', '500x500').replace('50x50', '500x500'),
              streamUrl: urls.primaryUrl,
              quality320: urls.quality320,
              quality160: urls.quality160,
              source: 'saavn',
              year: item.year,
            });
          }
        }
      }
    }

    // Also fetch top tracks from Audius trending
    const audiusTrending = await fetch('https://discoveryprovider.audius.co/v1/tracks/trending?app_name=spotify_web_app')
      .then(r => r.json())
      .catch(() => null);

    const audiusSongs: SongItem[] = [];
    if (audiusTrending?.data && Array.isArray(audiusTrending.data)) {
      for (const track of audiusTrending.data.slice(0, 15)) {
        const artwork = track.artwork?.['480x480'] || track.artwork?.['150x150'] || '';
        const stream = `https://discoveryprovider.audius.co/v1/tracks/${track.track_id}/stream?app_name=spotify_web_app`;
        audiusSongs.push({
          id: `audius_${track.track_id}`,
          title: cleanHtml(track.title),
          artist: cleanHtml(track.user?.name || 'Audius Artist'),
          album: cleanHtml(track.genre || 'Trending'),
          duration: Math.round(track.duration) || 180,
          image: artwork,
          streamUrl: stream,
          quality320: stream,
          quality160: stream,
          source: 'audius',
        });
      }
    }

    res.json({
      trending: trendingSongs,
      audius: audiusSongs,
      featuredPlaylists: defaultPlaylists,
    });
  } catch (err: any) {
    console.error('Trending error:', err);
    res.status(500).json({ error: 'Failed to fetch trending', message: err?.message });
  }
});

// Playlist details endpoint
app.get('/api/music/playlist/:id', async (req, res) => {
  const listId = req.params.id;
  try {
    const playlistData = await fetch(
      `https://www.jiosaavn.com/api.php?__call=playlist.getDetails&_format=json&_marker=0&cc=in&includeMetaTags=1&listid=${encodeURIComponent(listId)}`
    )
      .then(r => r.json())
      .catch(() => null);

    if (!playlistData) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const songs: SongItem[] = [];
    if (playlistData?.songs && Array.isArray(playlistData.songs)) {
      for (const item of playlistData.songs) {
        if (item.encrypted_media_url) {
          const urls = decryptMediaUrl(item.encrypted_media_url);
          if (urls) {
            songs.push({
              id: `saavn_${item.id}`,
              title: cleanHtml(item.song),
              artist: cleanHtml(item.primary_artists || item.singers || item.music || 'Artist'),
              album: cleanHtml(item.album || playlistData.listname),
              duration: parseInt(item.duration, 10) || 180,
              image: (item.image || playlistData.image || '').replace('150x150', '500x500').replace('50x50', '500x500'),
              streamUrl: urls.primaryUrl,
              quality320: urls.quality320,
              quality160: urls.quality160,
              source: 'saavn',
              year: item.year,
            });
          }
        }
      }
    }

    res.json({
      id: playlistData.listid,
      name: cleanHtml(playlistData.listname),
      image: (playlistData.image || '').replace('150x150', '500x500'),
      description: playlistData.description || 'Koleksi playlist resmi pilihan terbaik',
      totalSongs: songs.length,
      songs,
    });
  } catch (err: any) {
    console.error('Playlist fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch playlist', message: err?.message });
  }
});

// Lyrics endpoint via LRCLIB
app.get('/api/music/lyrics', async (req, res) => {
  const artist = (req.query.artist as string || '').trim();
  const title = (req.query.title as string || '').trim();

  if (!title) {
    return res.json({ lyrics: null });
  }

  // Clean title: remove featuring, remaster, etc.
  const cleanTitle = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\..*$/i, '')
    .trim();

  const cleanArtistName = artist
    .split(',')[0]
    .split('&')[0]
    .trim();

  try {
    const lrcUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtistName)}&track_name=${encodeURIComponent(cleanTitle)}`;
    const lrcRes = await fetch(lrcUrl, {
      headers: { 'User-Agent': 'Spotify-Clone/1.0' },
    }).then(r => (r.ok ? r.json() : null)).catch(() => null);

    if (lrcRes) {
      return res.json({
        plainLyrics: lrcRes.plainLyrics || null,
        syncedLyrics: lrcRes.syncedLyrics || null,
        instrumental: lrcRes.instrumental || false,
      });
    }

    // Fallback: search lrclib
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtistName} ${cleanTitle}`)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Spotify-Clone/1.0' },
    }).then(r => (r.ok ? r.json() : null)).catch(() => null);

    if (searchRes && Array.isArray(searchRes) && searchRes.length > 0) {
      return res.json({
        plainLyrics: searchRes[0].plainLyrics || null,
        syncedLyrics: searchRes[0].syncedLyrics || null,
        instrumental: searchRes[0].instrumental || false,
      });
    }

    return res.json({ plainLyrics: null, syncedLyrics: null });
  } catch {
    return res.json({ plainLyrics: null, syncedLyrics: null });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'spotify-music-server' });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Music server running at http://0.0.0.0:${PORT}`);
  });
}

export default app;

const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.cjs') ||
  process.argv[1].endsWith('server.js') ||
  process.argv[1].includes('tsx')
);

if (!process.env.VERCEL && isMainModule) {
  start();
}
