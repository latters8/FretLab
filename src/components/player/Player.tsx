import React, { useEffect, useRef } from 'react';
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
  const { isPlaying, currentTrack } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const getEmbedUrl = (videoId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Формируем чистые, нативные параметры YouTube
    const params = new URLSearchParams({
      enablejsapi: '1',
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      rel: '0',
      fs: '1',
      origin: origin
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  return (
    <div style={{ 
      background: 'var(--bg-panel)', 
      width: '100%', 
      height: height, 
      position: 'relative', 
      borderBottom: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {currentTrack && currentTrack.platform === 'youtube' ? (
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={getEmbedUrl(currentTrack.id)}
          title="Native YouTube Player"
          frameBorder="0"
          // 🔥 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ:
          // Полностью удален атрибут 'sandbox', вызывавший блокировку серверами Google.
          // Добавлен 'web-share' для нативного поведения платформы.
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          style={{ display: 'block', backgroundColor: '#000' }}
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
          Awaiting Media Stream
        </div>
      )}
    </div>
  );
};

export default Player;