import React, { useState } from 'react';

const TRACKS = [
  { id: 'HdsP-KYQZDQ', name: '🎸 E Minor Blues Jam Track' },
  { id: 'd7Q6t2Lw4R8', name: '🎵 Jazz Standard' },
  { id: 'R0r0E8sPqI4', name: '🎶 Rock Backing Track' },
];

const Player: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState(TRACKS[0].id);

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', padding: '8px', border: '1px solid var(--border-color)' }}>
      <div style={{ position: 'relative', paddingBottom: '40%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-sm)', background: '#000' }}>
        <iframe
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          src={`https://www.youtube.com/embed/${currentTrack}?enablejsapi=1&rel=0`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="YouTube Jam Track"
        ></iframe>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
        <select
          value={currentTrack}
          onChange={(e) => setCurrentTrack(e.target.value)}
          style={{ flex: 1, background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
        >
          {TRACKS.map(track => (
            <option key={track.id} value={track.id}>{track.name}</option>
          ))}
        </select>
        <button style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--accent)', border: 'none', color: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold' }}>
          ⏸ Pause
        </button>
      </div>
    </div>
  );
};

export default Player;