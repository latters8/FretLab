import React, { useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';

// 1. Определение пропсов согласно спецификации
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

  // 2. Управление плеером через postMessage API
  useEffect(() => {
    if (!iframeRef.current) return;
    
    try {
      const message = isPlaying 
        ? '{"event":"command","func":"playVideo","args":""}' 
        : '{"event":"command","func":"pauseVideo","args":""}';
        
      iframeRef.current.contentWindow?.postMessage(message, '*');
    } catch (error) {
      console.error("FretLab Player Error: Failed to send postMessage to iframe", error);
    }
  }, [isPlaying]);

  // 3. Генерация безопасного и полнофункционального Embed URL
  const getEmbedUrl = (videoId: string) => {
    // Получаем текущий домен для параметра origin (требование безопасности YouTube)
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    const params = new URLSearchParams({
      enablejsapi: '1',
      autoplay: autoplay ? '1' : '0',
      controls: controls ? '1' : '0',
      showinfo: '0',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      playsinline: '1',
      origin: origin,
      fs: '1',
      disablekb: '0'
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  // 4. UI/UX: Адаптивный рендер с визуальными состояниями
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
        // Активное состояние: Полноценный плеер с видео
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={getEmbedUrl(currentTrack.id)}
          title="FretLab YouTube Player"
          frameBorder="0"
          // Требования безопасности
          sandbox="allow-same-origin allow-scripts allow-forms allow-presentation allow-popups"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ display: 'block', backgroundColor: 'var(--bg-primary)' }}
        />
      ) : (
        // Пустое состояние: Заглушка согласно ТЗ
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
          No track selected
        </div>
      )}
    </div>
  );
};

export default Player;