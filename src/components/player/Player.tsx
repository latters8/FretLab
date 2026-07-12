import React, { useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';

const Player: React.FC = () => {
  const { isPlaying, currentTrack } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    const message = isPlaying 
      ? '{"event":"command","func":"playVideo","args":""}' 
      : '{"event":"command","func":"pauseVideo","args":""}';
      
    iframeRef.current.contentWindow?.postMessage(message, '*');
  }, [isPlaying]);

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '16px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      {/* 🔥 Высота увеличена до 420px для масштабного джем-экрана */}
      <div style={{ background: '#000', height: '420px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
        {currentTrack && currentTrack.platform === 'youtube' ? (
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentTrack.id}?enablejsapi=1&controls=1&showinfo=0&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)' }}>
            No track selected
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;