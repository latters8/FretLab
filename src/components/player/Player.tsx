import React from 'react';
import { useMusic } from '../../context/MusicContext';

const Player: React.FC = () => {
  const { currentTrack } = useMusic();

  // Генерируем правильный URL для iframe в зависимости от платформы
  const getEmbedUrl = () => {
    switch (currentTrack.platform) {
      case 'youtube':
        // ?rel=0 отключает рекомендации из других каналов, чтобы не уводить пользователя
        return `https://www.youtube.com/embed/${currentTrack.id}?rel=0&showinfo=0&modestbranding=1`;
      case 'rutube':
        return `https://rutube.ru/play/embed/${currentTrack.id}`;
      case 'vk':
        // Формат VK: oid=...&id=...
        return `https://vk.com/video_ext.php?${currentTrack.id}`;
      default:
        return '';
    }
  };

  return (
    <div style={{ 
        background: 'var(--bg-panel)', borderRadius: 'var(--radius)', 
        overflow: 'hidden', border: '1px solid var(--border-color)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' 
    }}>
      {/* Шапка плеера */}
      <div style={{ 
          padding: '12px 20px', background: 'var(--bg-primary)', 
          borderBottom: '1px solid var(--border-color)', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            // Jam Player ({currentTrack.platform})
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {currentTrack.title}
          </span>
        </div>
      </div>

      {/* Окно видео */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
        <iframe 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          src={getEmbedUrl()} 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default Player;