import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../context/MusicContext';

interface PlayerProps {
  height?: string | number;
  autoplay?: boolean;
  controls?: boolean;
}

const Player: React.FC<PlayerProps> = ({ 
  height = '420px', 
  autoplay = true, 
  controls = true 
}) => {
  const { isPlaying, currentTrack, setCurrentTrack } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [urlInput, setUrlInput] = useState('');

  // Отправка команд (работает преимущественно для YouTube API)
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

  // 🔥 МУЛЬТИПЛАТФОРМЕННЫЙ ПАРСЕР ССЫЛОК
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    // Регулярные выражения для трех платформ
    const ytVideoMatch = urlInput.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*embed\/|.*\/))([^&?\s]{11})/);
    const ytListMatch = urlInput.match(/[?&]list=([^&?\s]+)/);
    const rutubeMatch = urlInput.match(/rutube\.ru\/video\/([a-zA-Z0-9_-]+)/);
    const vkMatch = urlInput.match(/vk\.com\/video(-?\d+)_(\d+)/);

    if (ytVideoMatch || ytListMatch) {
      let trackId = '';
      if (ytVideoMatch && ytListMatch) trackId = `${ytVideoMatch[1]}&list=${ytListMatch[1]}`;
      else if (ytListMatch) trackId = `videoseries?list=${ytListMatch[1]}`;
      else if (ytVideoMatch) trackId = ytVideoMatch[1];
      
      setCurrentTrack({ platform: 'youtube', id: trackId, title: 'YouTube Stream' });
      setUrlInput(''); 
    } 
    else if (rutubeMatch) {
      setCurrentTrack({ platform: 'rutube', id: rutubeMatch[1], title: 'RUTUBE Stream' });
      setUrlInput('');
    } 
    else if (vkMatch) {
      setCurrentTrack({ platform: 'vk', id: `${vkMatch[1]}_${vkMatch[2]}`, title: 'VK Video Stream' });
      setUrlInput('');
    } 
    else {
      alert("Please paste a valid YouTube, RUTUBE, or VK Video link!");
    }
  };

  // 🔥 ОТКРЫТИЕ ПОИСКА НА ВЫБРАННОЙ ПЛОЩАДКЕ
  const handlePlatformSearch = (platform: 'youtube' | 'rutube' | 'vk') => {
    const query = 'guitar backing track jam';
    let url = '';
    
    if (platform === 'youtube') url = `https://www.youtube.com/results?search_query=${query.replace(/ /g, '+')}`;
    if (platform === 'rutube') url = `https://rutube.ru/search/?query=${query.replace(/ /g, '+')}`;
    if (platform === 'vk') url = `https://vk.com/video/search?q=${query.replace(/ /g, '%20')}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 🔥 ГЕНЕРАТОР EMBED-ССЫЛОК ДЛЯ 3-Х ПЛАТФОРМ
  const getEmbedUrl = (trackId: string, platform: string = 'youtube') => {
    if (platform === 'rutube') {
      return `https://rutube.ru/play/embed/${trackId}`;
    }
    
    if (platform === 'vk') {
      const [oid, vid] = trackId.split('_');
      return `https://vk.com/video_ext.php?oid=${oid}&id=${vid}&hd=2&autoplay=${autoplay ? 1 : 0}`;
    }

    // Default: YouTube
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      enablejsapi: '1',
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      rel: '0',
      fs: '1',
      origin: origin
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
      
      <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        
        {/* 🚀 НОВЫЙ БЛОК: КНОПКИ ПЛОЩАДОК */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginRight: '4px' }}>SEARCH:</span>
          
          {/* YouTube (Красный) */}
          <button type="button" onClick={() => handlePlatformSearch('youtube')} title="Search on YouTube" style={{ width: '24px', height: '24px', background: '#FF0000', color: '#FFF', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            YT
          </button>

          {/* RUTUBE (Голубой) */}
          <button type="button" onClick={() => handlePlatformSearch('rutube')} title="Search on RUTUBE" style={{ width: '24px', height: '24px', background: '#00D9F5', color: '#000', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            RU
          </button>

          {/* VK Video (Синий) */}
          <button type="button" onClick={() => handlePlatformSearch('vk')} title="Search on VK Video" style={{ width: '24px', height: '24px', background: '#0077FF', color: '#FFF', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', cursor: 'pointer', transition: '0.2s', padding: 0 }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            VK
          </button>
        </div>

        {/* СТРОКА ВВОДА ССЫЛКИ */}
        <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input 
            type="text" 
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="🔗 Paste YT, RU, or VK video link here..."
            style={{ flex: 1, background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', outline: 'none', transition: '0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <button type="submit" style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0 24px', borderRadius: '20px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}>
            LOAD
          </button>
        </form>
      </div>

      {/* 📺 КОНТЕЙНЕР ВИДЕО */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#000' }}>
        {currentTrack && ['youtube', 'rutube', 'vk'].includes(currentTrack.platform) ? (
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={getEmbedUrl(currentTrack.id, currentTrack.platform)}
            title="Media Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            style={{ display: 'block' }}
          />
        ) : (
          <div aria-label="No track selected" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 800, textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '16px', opacity: 0.5 }}>🎵</span>
            Awaiting Media Stream<br/>
            <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-secondary)', textTransform: 'none', marginTop: '8px', display: 'block' }}>Search a platform or paste a link</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default Player;