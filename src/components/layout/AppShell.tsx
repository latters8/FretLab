import React, { useState } from 'react';
import Header from './Header';
import Player from '../player/Player';
import CircleOfFifths from '../tools/CircleOfFifths';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature';
import DiatonicChords from '../tools/DiatonicChords';
import ChordDictionary from '../tools/ChordDictionary';
import AISearchBar from '../ai/AISearchBar';
import { ToneSetupModal } from '../tools/ToneSetupModal';

const AppShell: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'engine' | 'dictionary'>('engine');
  const [isToneSetupOpen, setIsToneSetupOpen] = useState(false);
  
  // 🔥 Храним аккорд, который приказал открыть ИИ-дирижер
  const [aiTargetChord, setAiTargetChord] = useState<string | null>(null);

  // Обработчик команд от TouchGrass
  const handleAIAction = (action: any) => {
    if (!action) return;
    
    if (action.type === 'OPEN_CHORD') {
      setActiveModule('dictionary');
      if (action.payload && action.payload.chord) {
        setAiTargetChord(action.payload.chord); // Запоминаем аккорд (например, Cmaj7)
      }
    } else if (action.type === 'OPEN_TAB_GEN') {
      setActiveModule('engine');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-secondary)' }}>
      <Header />
      
      <div className="app-layout">
        <aside className="left-sidebar">
            <div onClick={() => setActiveModule('engine')} style={{ padding: '12px', background: activeModule === 'engine' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'engine' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} title="Fretboard Engine">🎸</div>
            <div onClick={() => setActiveModule('dictionary')} style={{ padding: '12px', background: activeModule === 'dictionary' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'dictionary' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} title="Chord Dictionary">📖</div>
            <div onClick={() => setIsToneSetupOpen(true)} style={{ padding: '12px', background: 'transparent', color: 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s', marginTop: 'auto' }} title="Tone & AI Setup" onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>🎛</div>
        </aside>

        <div className="main-workspace">
          {activeModule === 'engine' ? (
            <>
              <main className="center-column">
                  {/* Подключаем слушатель команд к поисковой строке */}
                  <AISearchBar onAction={handleAIAction} />
                  <Player />
                  <div className="fretboard-scroll-wrapper"><Fretboard /></div>
                  <Tablature />
              </main>
              <aside className="right-column">
                  <CircleOfFifths />
                  <DiatonicChords />
              </aside>
            </>
          ) : (
            <main className="center-column" style={{ overflowY: 'hidden' }}>
                {/* Передаем приказ от ИИ внутрь словаря */}
                <ChordDictionary targetChord={aiTargetChord} />
            </main>
          )}
        </div>
      </div>
      <ToneSetupModal isOpen={isToneSetupOpen} onClose={() => setIsToneSetupOpen(false)} />
    </div>
  );
};

export default AppShell;