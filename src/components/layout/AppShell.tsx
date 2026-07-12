import React, { useState } from 'react';
import Header from './Header';
import Player from '../player/Player';
import CircleOfFifths from '../tools/CircleOfFifths';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature';
import DiatonicChords from '../tools/DiatonicChords';
import ChordDictionary from '../tools/ChordDictionary';
import AISearchBar from '../ai/AISearchBar';

const AppShell: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'engine' | 'dictionary'>('engine');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-secondary)' }}>
      <Header />
      
      <div className="app-layout">
        
        {/* Left Sidebar - MENU */}
        <aside className="left-sidebar">
            <div 
              onClick={() => setActiveModule('engine')}
              style={{ padding: '12px', background: activeModule === 'engine' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'engine' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} 
              title="Fretboard Engine"
            >
              🎸
            </div>
            
            <div 
              onClick={() => setActiveModule('dictionary')}
              style={{ padding: '12px', background: activeModule === 'dictionary' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'dictionary' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} 
              title="Chord Dictionary"
            >
              📖
            </div>
        </aside>

        {/* Dynamic Workspace */}
        <div className="main-workspace">
          
          {activeModule === 'engine' ? (
            <>
              {/* MAIN WORKSPACE */}
              <main className="center-column">
                  <AISearchBar />
                  <Player />
                  
                  {/* Обертка для свайпа грифа на мобильных устройствах */}
                  <div className="fretboard-scroll-wrapper">
                    <Fretboard />
                  </div>
                  
                  <Tablature />
              </main>
              
              {/* RIGHT SIDEBAR */}
              <aside className="right-column">
                  <CircleOfFifths />
                  <DiatonicChords />
              </aside>
            </>
          ) : (
            <main className="center-column" style={{ overflowY: 'hidden' }}>
                <ChordDictionary />
            </main>
          )}

        </div>
      </div>
    </div>
  );
};

export default AppShell;