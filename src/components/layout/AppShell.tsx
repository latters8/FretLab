import React, { useState } from 'react';
import Header from './Header';
import Player from '../player/Player';
import CircleOfFifths from '../tools/CircleOfFifths';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature';
import DiatonicChords from '../tools/DiatonicChords';
import ChordDictionary from '../tools/ChordDictionary'; // Подключаем Справочник

const AppShell: React.FC = () => {
  // Состояние активного экрана (модуля)
  const [activeModule, setActiveModule] = useState<'engine' | 'dictionary'>('engine');

  return (
    <div style={{ display: 'grid', gridTemplateRows: '64px 1fr', height: '100vh', background: 'var(--bg-secondary)' }}>
      <Header />
      
      <div style={{ display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Sidebar - MENU */}
        <aside style={{ width: '120px', padding: '20px 0', borderRight: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
            {/* Кнопка "Студия" */}
            <div 
              onClick={() => setActiveModule('engine')}
              style={{ padding: '12px', background: activeModule === 'engine' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'engine' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} 
              title="Fretboard Engine"
            >
              🎸
            </div>
            
            <div style={{ padding: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} title="Practice Mode" onMouseEnter={e => e.currentTarget.style.color='var(--accent)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
              📝
            </div>
            
            {/* Кнопка "Словарь" */}
            <div 
              onClick={() => setActiveModule('dictionary')}
              style={{ padding: '12px', background: activeModule === 'dictionary' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'dictionary' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} 
              title="Chord Dictionary"
            >
              📖
            </div>

            <div style={{ padding: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} title="Tone Setup" onMouseEnter={e => e.currentTarget.style.color='var(--accent)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
              🎛
            </div>
        </aside>

        {/* Dynamic Workspace */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {activeModule === 'engine' ? (
            // РЕЖИМ 1: Основной Fretboard Engine (Плеер, Гриф, Круг)
            <>
              <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <Player />
                  <Fretboard />
                  <Tablature />
              </main>
              <aside style={{ width: '340px', padding: '24px 16px', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-panel)', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flexShrink: 0 }}>
                  <CircleOfFifths />
                  <DiatonicChords />
              </aside>
            </>
          ) : (
            // РЕЖИМ 2: Полноэкранный справочник аккордов
            <main style={{ flex: 1, padding: '24px 32px', overflowY: 'hidden' }}>
                <ChordDictionary />
            </main>
          )}

        </div>
      </div>
    </div>
  );
};

export default AppShell;