import React, { useState } from 'react';
import Header from './Header';
import Player from '../player/Player';
import CircleOfFifths from '../tools/CircleOfFifths';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature';
import DiatonicChords from '../tools/DiatonicChords';
import ChordDictionary from '../tools/ChordDictionary';
import AutoTab from '../tools/AutoTab';
// 🔥 ИСПРАВЛЕНО: Явный импорт нового компонента контроллера
import ToolBox from '../tools/ToolBox';

const AppShell: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'engine' | 'dictionary' | 'autotab'>('engine');
  const [aiTargetChord, setAiTargetChord] = useState<string | null>(null);

  const handleAIAction = (action: any) => {
    if (!action) return;
    if (action.type === 'OPEN_CHORD') {
      setActiveModule('dictionary');
      if (action.payload && action.payload.chord) setAiTargetChord(action.payload.chord);
    } else if (action.type === 'OPEN_TAB_GEN') {
      setActiveModule('engine');
    } else if (action.type === 'OPEN_AUTOTAB') {
      setActiveModule('autotab');
    } else if (action.type === 'SEARCH_YOUTUBE') {
      const query = encodeURIComponent(action.payload.query + ' guitar backing track');
      window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="app-container">
      <Header onAIAction={handleAIAction} />
      
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="app-layout">
          <aside className="left-sidebar">
              <div onClick={() => setActiveModule('engine')} style={{ padding: '12px', background: activeModule === 'engine' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'engine' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} title="Fretboard Engine">🎸</div>
              <div onClick={() => setActiveModule('dictionary')} style={{ padding: '12px', background: activeModule === 'dictionary' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'dictionary' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} title="Chord Dictionary">📖</div>
              <div onClick={() => setActiveModule('autotab')} style={{ padding: '12px', background: activeModule === 'autotab' ? 'var(--bg-hover)' : 'transparent', color: activeModule === 'autotab' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '12px', cursor: 'pointer', fontSize: '24px', transition: '0.2s' }} title="AutoTab / Songsterr Mode">🎼</div>
          </aside>

          <div className="main-workspace">
            {activeModule === 'engine' && (
              <>
                <main className="center-column">
                    <Player />
                    <div className="fretboard-scroll-wrapper"><Fretboard /></div>
                    <Tablature />
                </main>
                
                {/* 🔥 ИСПРАВЛЕНО: Добавлен принудительный независимый вертикальный скролл для правой колонки */}
                <aside className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%' }}>
                    <CircleOfFifths />
                    <DiatonicChords />
                    <ToolBox /> 
                </aside>
              </>
            )}

            {activeModule === 'dictionary' && (
              <main className="center-column" style={{ overflowY: 'hidden' }}>
                  <ChordDictionary targetChord={aiTargetChord} />
              </main>
            )}

            {activeModule === 'autotab' && (
              <main className="center-column" style={{ overflowY: 'hidden' }}>
                  <AutoTab />
              </main>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;