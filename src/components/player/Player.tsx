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

  useEffect(() => {
    if (!iframeRef.current) return;
    try {
      const message = isPlaying 
        ? '{"event":"command","func":"playVideo","args":""}' 
        : '{"event":"command","func":"pauseVideo","args":""}';
      iframeRef.current.contentWindow?.postMessage(message, '*');
    } catch (error) {
      console.error("FretLab Player Error:", error);
    }
  }, [isPlaying]);

  // 🔥 Обработчик вставки ссылки прямо в плеер
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const videoMatch = urlInput.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*embed\/|.*\/))([^&?\s]{11})/);
    const playlistMatch = urlInput.match(/[?&]list=([^&?\s]+)/);

    let trackId = '';
    if (videoMatch && playlistMatch) {
      trackId = `${videoMatch[1]}&list=${playlistMatch[1]}`;
    } else if (playlistMatch) {
      trackId = `videoseries?list=${playlistMatch[1]}`;
    } else if (videoMatch) {
      trackId = videoMatch[1];
    }

    if (trackId) {
      setCurrentTrack({ platform: 'youtube', id: trackId, title: 'Custom Link Stream' });
      setUrlInput(''); // Очищаем строку после успешной загрузки
    } else {
      alert("Please paste a valid YouTube Video or Playlist link!");
    }
  };

  const getEmbedUrl = (trackId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      enablejsapi: '1',
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      rel: '0',
      fs: '1',
      origin: origin
    });

    // Обработка сложных URL (Плейлисты)
    if (trackId.startsWith('videoseries?')) {
      return `https://www.youtube.com/embed/${trackId}&${params.toString()}`;
    } else if (trackId.includes('&list=')) {
      return `https://www.youtube.com/embed/${trackId}&${params.toString()}`;
    } else {
      return `https://www.youtube.com/embed/${trackId}?${params.toString()}`;
    }
  };

  return (
    <div style={{ 
      background: 'var(--bg-panel)', 
      width: '100%', 
      height: height, 
      display: 'flex',
      flexDirection: 'column',
      borderBottom: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      
      {/* 🚀 АДРЕСНАЯ СТРОКА ПЛЕЕРА */}
      <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="🔗 Paste YouTube Video or Playlist link here..."
            style={{ flex: 1, background: 'var(--bg-root)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', outline: 'none', transition: '0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <button type="submit" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0 20px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            LOAD
          </button>
        </form>
      </div>

      {/* 📺 КОНТЕЙНЕР ВИДЕО */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#000' }}>
        {currentTrack && currentTrack.platform === 'youtube' ? (
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={getEmbedUrl(currentTrack.id)}
            title="Native YouTube Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            style={{ display: 'block' }}
          />
        ) : (
          <div 
            aria-label="No track selected"
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              color: 'var(--text-muted)', 
              fontSize: '14px', 
              fontWeight: 800, 
              textAlign: 'center', 
              letterSpacing: '1px', 
              textTransform: 'uppercase' 
            }}
          >
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '16px', opacity: 0.5 }}>🎵</span>
            Awaiting Media Stream<br/>
            <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-secondary)', textTransform: 'none', marginTop: '8px', display: 'block' }}>Paste a link above or ask TouchGrass</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default Player;