import React from 'react';
import Header from './Header';
import Player from '../player/Player';
import CircleOfFifths from '../tools/CircleOfFifths';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature'; // <-- Импорт табулатуры
import DiatonicChords from '../tools/DiatonicChords';
import AISearchBar from '../ai/AISearchBar';

const AppShell: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateRows: '56px 1fr', height: '100vh', background: 'var(--bg-secondary)' }}>
      <Header />
      
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 340px', overflow: 'hidden' }}>
        
        {/* Left Sidebar */}
        <aside style={{ padding: '12px', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '10px' }}>NAVIGATION</div>
            <div style={{ padding: '8px', background: 'var(--bg-hover)', color: 'var(--accent)', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', gap: '8px' }}>
              <span>🎸</span> Fretboard
            </div>
            <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', display: 'flex', gap: '8px', marginTop: '4px' }}>
              <span>📝</span> Practice
            </div>
        </aside>

        {/* Center Workspace */}
        <main style={{ padding: '16px', overflowY: 'auto', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AISearchBar />
            <Player />
            <Fretboard />
            <Tablature /> {/* <-- Добавили табулатуру прямо под гриф */}
        </main>

        {/* Right Sidebar */}
        <aside style={{ padding: '14px', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            <CircleOfFifths />
            <DiatonicChords />
        </aside>
        
      </div>
    </div>
  );
};

export default AppShell;