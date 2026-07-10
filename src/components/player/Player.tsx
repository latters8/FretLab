import React from 'react';
import { useMusic } from '../../context/MusicContext';

const Player: React.FC = () => {
  const { currentTrack } = useMusic();
  
  // Фолбэк на случай, если контекст еще подгружается
  const track = currentTrack || { 
    platform: 'youtube', 
    id: 'HdsP-KYQZDQ', 
    title: 'Liquid Groove Fusion Backing Track - Em' 
  };

  const getEmbedUrl = () => {
    // Используем полноценный YouTube с включенной навигацией (controls=1)
    if (track.platform === 'youtube') return `https://www.youtube.com/embed/${track.id}?controls=1&rel=0&playsinline=1`;
    if (track.platform === 'rutube') return `https://rutube.ru/play/embed/${track.id}`;
    if (track.platform === 'vk') return `https://vk.com/video_ext.php?oid=-1&id=${track.id}`;
    return '';
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: '12px 20px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            // Jam Player ({track.platform})
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {track.title}
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
        <iframe 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          src={getEmbedUrl()} 
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default Player;