import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../context/MusicContext';

interface PlayerProps {
  height?: string | number;
  autoplay?: boolean;
  controls?: boolean;
}

// 🎸 Золотой фонд встроенных треков для циклического переключения кнопкой NEXT
const CURATED_JAM_TRACKS = [
  { id: '8KpPab_M4t4', title: '🎸 Heavy Rock Groove Jam', key: 'A', mode: 'aeolian', bpm: 120, platform: 'youtube' },
  { id: 'X5X1i5H9m2s', title: '⚡ C Dorian Funk Power Groove', key: 'C', mode: 'dorian', bpm: 110, platform: 'youtube' },
  { id: '3W1A142r-yE', title: '☕ Slow Blues Midnight Jam', key: 'A', mode: 'aeolian', bpm: 80, platform: 'youtube' }
];

const Player: React.FC<PlayerProps> = ({ 
  height = '420px', 
  autoplay = true, 
  controls = true 
}) => {
  const { isPlaying, currentTrack, setKeyNote, setMode, setBpm, setCurrentTrack } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (!iframeRef.current || currentTrack?.platform !== 'youtube') return;
    try {
      const message = isPlaying 
        ? '{"event":"command","func":"playVideo","args":""}' 
        : '{"event":"command","func":"pauseVideo","args":""}';
      iframeRef.current.contentWindow?.postMessage(message, '*');
    } catch (error) {
      console.error("FretLab Player Error:", error);
    }
  }, [isPlaying, currentTrack]);

  // 🔥 БРОНЕБОЙНЫЙ МУЛЬТИПЛАТФОРМЕННЫЙ ПАРСЕР (ВК ПОЧИНЕН!)
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const input = urlInput.trim();

    // 1. Проверка YouTube (видео и плейлисты)
    const ytVideoMatch = input.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*embed\/|.*\/))([^&?\s]{11})/);
    const ytListMatch = input.match(/[?&]list=([^&?\s]+)/);

    // 2. Проверка RUTUBE
    const rutubeMatch = input.match(/rutube\.ru\/video\/([a-zA-Z0-9_-]+)/);

    // 3. 🔥 СВЕРХУМНЫЙ ИСПРАВЛЕННЫЙ ПАРСЕР ДЛЯ VK VIDEO (vkvideo.ru, клипы, z=video и т.д.)
    const isVk = input.toLowerCase().includes('vk') || input.toLowerCase().includes('vkvideo');
    const vkIdMatch = input.match(/(-?\d+)_(\d+)/);

    if (ytVideoMatch || ytListMatch) {
      let trackId = '';
      if (ytVideoMatch && ytListMatch) trackId = `${ytVideoMatch[1]}&list=${ytListMatch[1]}`;
      else if (ytListMatch) trackId = `videoseries?list=${ytListMatch[1]}`;
      else if (ytVideoMatch) trackId = ytVideoMatch[1];
      
      setCurrentTrack({ platform: 'youtube', id: trackId, title: 'Custom YouTube Jam Stream' });
      setUrlInput(''); 
    } 
    else if (rutubeMatch) {
      setCurrentTrack({ platform: 'rutube', id: rutubeMatch[1], title: 'Custom RUTUBE Jam Stream' });
      setUrlInput('');
    } 
    else if (isVk && vkIdMatch) {
      // Вытаскиваем ID в любом случае, даже если ссылка облеплена текстом или параметрами!
      const trackId = `${vkIdMatch[1]}_${vkIdMatch[2]}`;
      setCurrentTrack({ platform: 'vk', id: trackId, title: 'Custom VK Video Jam Stream' });
      setUrlInput('');
    } 
    else {
      alert("Invalid link! Please paste a valid link from YouTube, RUTUBE, or VK Video.");
    }
  };

  // 🔥 ИНТЕЛЛЕКТУАЛЬНАЯ ФУНКЦИЯ ДЛЯ КНОПКИ NEXT
  const handleNextTrack = () => {
    // Находим индекс текущего трека среди нашей коллекции
    const currentIndex = CURATED_JAM_TRACKS.findIndex(t => t.id === currentTrack?.id);
    // Вычисляем следующий индекс (зацикливаем по кругу)
    const nextIndex = (currentIndex + 1) % CURATED_JAM_TRACKS.length;
    const nextTrack = CURATED_JAM_TRACKS[nextIndex];

    // Синхронно обновляем среду FretLab
    setKeyNote(nextTrack.key);
    setMode(nextTrack.mode as any);
    setBpm(nextTrack.bpm);
    
    setCurrentTrack({
      platform: nextTrack.platform as any,
      id: nextTrack.id,
      title: nextTrack.title
    });
  };

  const handlePlatformSearch = (platform: 'youtube' | 'rutube' | 'vk') => {
    const query = 'guitar backing track jam';
    let url = '';
    if (platform === 'youtube') url = `https://www.youtube.com/results?search_query=${query.replace(/ /g, '+')}`;
    if (platform === 'rutube') url = `https://rutube.ru/search/?query=${query.replace(/ /g, '+')}`;
    if (platform === 'vk') url = `https://vk.com/video/search?q=${query.replace(/ /g, '%20')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getEmbedUrl = (trackId: string, platform: string = 'youtube') => {
    if (platform === 'rutube') {
      return `https://rutube.ru/play/embed/${trackId}`;
    }
    if (platform === 'vk') {
      const [oid, vid] = trackId.split('_');
      return `https://vk.com/video_ext.php?oid=${oid}&id=${vid}&hd=2&autoplay=${autoplay ? 1 : 0}`;
    }
    // YouTube Default
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      enablejsapi: '1', autoplay: autoplay ? '1' : '0', controls: controls ? '1' : '0',
      rel: '0', fs: '1', origin: origin
    });
    if (trackId.startsWith('videoseries?')) {
      return `https://www.youtube.com/embed/${trackId}&${params.toString()}`;
    } else if (trackId.includes('&list=')) {
      return `https://www.youtube.com/embed/${trackId}&${params.toString()}`;
    } else {
      params.set('loop', '1');
      params.set('playlist', trackId);
      return `https://www.youtube.com/embed/${trackId}?${params.toString()}`;
    }
  };

  return (
    <div style={{ background: 'var(--bg-panel)', width: '100%', height: height, display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
      
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ ПЛЕЕРОМ */}
      <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        
        {/* СТИЛИЗОВАННЫЕ КВАДРАТНЫЕ ЛОГОТИПЫ ПОИСКА */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginRight: '4px' }}>SEARCH:</span>
          
          {/* YouTube (Ярко-красный) */}
          <button type="button" onClick={() => handlePlatformSearch('youtube')} title="Search on YouTube" style={{ width: '24px', height: '24px', background: '#FF0000', color: '#FFF', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            YT
          </button>

          {/* 🔥 RUTUBE (Официальный глубокий темно-синий цвет #0A1128 с неоновым белым текстом) */}
          <button type="button" onClick={() => handlePlatformSearch('rutube')} title="Search on RUTUBE" style={{ width: '24px', height: '24px', background: '#0A1128', color: '#00D9F5', border: '1px solid #00D9F5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            RU
          </button>

          {/* 🔥 VK Video (Фирменный королевский синь #0077FF) */}
          <button type="button" onClick={() => handlePlatformSearch('vk')} title="Search on VK Video" style={{ width: '24px', height: '24px', background: '#0077FF', color: '#FFF', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            VK
          </button>
        </div>

        {/* АДРЕСНАЯ СТРОКА ЗАГРУЗКИ ССЫЛОК */}
        <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input 
            type="text" 
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="🔗 Paste YouTube, RUTUBE, or VK Video link here..."
            style={{ flex: 1, background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', outline: 'none', transition: '0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <button type="submit" style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 20px', borderRadius: '20px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}>
            LOAD
          </button>
        </form>

        {/* 🔥 ДОБАВЛЕНА КНОПКА NEXT VIBE ДЛЯ СИНХРОННОГО ПЕРЕКЛЮЧЕНИЯ ТРЕКОВ */}
        <button 
          type="button"
          onClick={handleNextTrack}
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s', whiteSpace: 'nowrap' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          title="Switch to next curated backing track preset"
        >
          ⏭ NEXT VIBE
        </button>
      </div>

      {/* 📺 ЭКРАН МЕДИА-ПОТОКА */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#000' }}>
        {currentTrack && ['youtube', 'rutube', 'vk'].includes(currentTrack.platform) ? (
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={getEmbedUrl(currentTrack.id, currentTrack.platform)}
            title="FretLab Media Hub Stream"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            style={{ display: 'block' }}
          />
        ) : (
          <div aria-label="No track selected" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 800, textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '16px', opacity: 0.5 }}>🎵</span>
            Awaiting Media Stream<br/>
            <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-secondary)', textTransform: 'none', marginTop: '8px', display: 'block' }}>Search a platform, paste any link, or hit NEXT VIBE</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default Player;