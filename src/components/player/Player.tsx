import React, { useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';

// 🔥 Явно описываем интерфейс для треков, чтобы TypeScript спал спокойно
interface JamTrack {
  id: string;
  title: string;
  key: string;
  mode: string;
  bpm: number;
  actualId?: string; // Поле может быть undefined, и мы это учтем
}

const JAM_STATION_TRACKS: JamTrack[] = [
  { id: '3W1A142r-yE', title: '🎸 Liquid Groove Fusion Jam', key: 'E', mode: 'minor', bpm: 100 },
  { id: 'X5X1i5H9m2s', title: '⚡ C Dorian Funk Power Groove', key: 'C', mode: 'dorian', bpm: 110 },
  { id: '3W1A142r-yE_blues', title: '☕ Slow Blues Midnight Jam', key: 'A', mode: 'aeolian', bpm: 80, actualId: '3W1A142r-yE' },
  { id: '8KpPab_M4t4', title: '🌌 Jazz Autumn Leaves Smooth', key: 'G', mode: 'major', bpm: 90, actualId: '8KpPab_M4t4' }
];

const Player: React.FC = () => {
  const { isPlaying, currentTrack, setKeyNote, setMode, setBpm, setCurrentTrack } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    const message = isPlaying 
      ? '{"event":"command","func":"playVideo","args":""}' 
      : '{"event":"command","func":"pauseVideo","args":""}';
      
    iframeRef.current.contentWindow?.postMessage(message, '*');
  }, [isPlaying]);

  const handleTrackSelect = (track: JamTrack) => {
    setKeyNote(track.key);
    setMode(track.mode as any);
    setBpm(track.bpm);
    
    setCurrentTrack({
      platform: 'youtube',
      // 🔥 Используем логическое ИЛИ: если actualId undefined, fallback на id (всегда string)
      id: track.actualId || track.id,
      title: track.title
    });
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Панель выбора треков внутри плеера */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          📻 Select Jam Track Station (Stays In Player)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {JAM_STATION_TRACKS.map((track) => {
            const videoId = track.actualId || track.id;
            const isSelected = currentTrack?.id === videoId;
            
            return (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                style={{
                  background: isSelected ? 'var(--bg-hover)' : 'var(--bg-primary)',
                  color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: '0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{track.title}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                  {track.key} {track.mode} ({track.bpm} BPM)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Контейнер видеоплеера */}
      <div style={{ background: '#000', height: '380px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
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
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}>
            🛑 Select a Jam Track above to ignite the engine
          </div>
        )}
      </div>

    </div>
  );
};

export default Player;