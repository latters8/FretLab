import React, { useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';

interface JamPreset {
  id: string;
  title: string;
  key: string;
  mode: string;
  bpm: number;
}

// 📚 Чистая, выверенная база пресетов для выпадающего меню плеера
const PRESET_JAMS: JamPreset[] = [
  { id: '3W1A142r-yE', title: '🎸 Liquid Groove Fusion Jam', key: 'E', mode: 'minor', bpm: 100 },
  { id: 'X5X1i5H9m2s', title: '⚡ C Dorian Funk Power Groove', key: 'C', mode: 'dorian', bpm: 110 },
  { id: '3W1A142r-yE_blues', title: '☕ Slow Blues Midnight Jam', key: 'A', mode: 'aeolian', bpm: 80 },
  { id: '8KpPab_M4t4', title: '🌌 Jazz Autumn Leaves Smooth', key: 'G', mode: 'major', bpm: 90 }
];

const Player: React.FC = () => {
  const { isPlaying, currentTrack, setKeyNote, setMode, setBpm, setCurrentTrack } = useMusic();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    
    // Посылаем сигналы управления стартом/паузой через YouTube Player API
    const message = isPlaying 
      ? '{"event":"command","func":"playVideo","args":""}' 
      : '{"event":"command","func":"pauseVideo","args":""}';
      
    iframeRef.current.contentWindow?.postMessage(message, '*');
  }, [isPlaying]);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const track = PRESET_JAMS.find(t => t.id === selectedId);
    if (track) {
      // Синхронизируем состояние всего приложения
      setKeyNote(track.key);
      setMode(track.mode as any);
      setBpm(track.bpm);
      
      setCurrentTrack({
        platform: 'youtube',
        id: track.id === '3W1A142r-yE_blues' ? '3W1A142r-yE' : track.id,
        title: track.title
      });
    }
  };

  // Ищем текущий выбранный пресет для синхронизации выпадающего списка
  const currentSelectValue = PRESET_JAMS.find(t => {
    const targetId = t.id === '3W1A142r-yE_blues' ? '3W1A142r-yE' : t.id;
    return currentTrack?.id === targetId;
  })?.id || '';

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 🔥 ЧИСТЫЙ И МИНИМАЛИСТИЧНЫЙ ТУЛБАР УПРАВЛЕНИЯ ТРЕКАМИ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', marginRight: '16px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            NOW STREAMING
          </span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTrack ? currentTrack.title : 'No Backing Track Engine Active'}
          </span>
        </div>

        {/* Интегрированный выпадающий список вместо кучи нерабочих кнопок */}
        <select
          value={currentSelectValue}
          onChange={handleDropdownChange}
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, outline: 'none', cursor: 'pointer', minWidth: '180px' }}
        >
          <option value="" disabled>▼ Select Jam Vibe</option>
          {PRESET_JAMS.map(t => (
            <option key={t.id} value={t.id}>
              {t.title.split(' ').slice(1).join(' ')} ({t.key} {t.mode})
            </option>
          ))}
        </select>
      </div>

      {/* МАССИВНОЕ ОКНО ВИДЕОПЛЕЕРА */}
      <div style={{ background: '#000', height: '420px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
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
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, textAlign: 'center', lineHeight: '1.6' }}>
            📻 Select a Vibe in the dropdown above<br />
            <span style={{ fontSize: '11px', fontWeight: 'normal' }}>or type "найди рок минус" into TouchGrass 🎵 search bar!</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default Player;