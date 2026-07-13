// src/components/layout/AppShell.tsx

import React, { useState } from 'react';
import Header from './Header';
import Player from '../player/Player';
import CircleOfFifths from '../tools/CircleOfFifths';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature';
import DiatonicChords from '../tools/DiatonicChords';
import ChordDictionary from '../tools/ChordDictionary';
import SoloGenerator from '../tools/SoloGenerator'; // 🔥 ИЗМЕНЕНО
import ToolBox from '../tools/ToolBox';
import PracticeDashboard from '../PracticeDashboard';
import { useMusic } from '../../context/MusicContext';

const AppShell: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'engine' | 'dictionary' | 'autotab' | 'practice'>('engine');
  const [aiTargetChord, setAiTargetChord] = useState<string | null>(null);
  
  const { setBpm } = useMusic();

  const handleAIAction = (action: any) => {
    if (!action) return;
    
    console.log('🔊 AppShell received action:', action);
    
    if (action.type === 'SET_BPM') {
      if (action.payload?.bpm) {
        setBpm(action.payload.bpm);
        console.log('🎵 BPM set to:', action.payload.bpm);
      }
      return;
    }
    
    if (action.type === 'OPEN_CHORD') {
      setActiveModule('dictionary');
      if (action.payload && action.payload.chord) setAiTargetChord(action.payload.chord);
    } 
    else if (action.type === 'OPEN_TAB_GEN' || action.type === 'OPEN_AUTOTAB') {
      setActiveModule('autotab');
    }
    else if (action.type === 'OPEN_ENGINE') {
      setActiveModule('engine');
    }
    else if (action.type === 'OPEN_PRACTICE') {
      setActiveModule('practice');
    }
    else if (action.type === 'SEARCH_BACKING' || action.type === 'SEARCH_YOUTUBE') {
      setActiveModule('engine');
      const query = encodeURIComponent(action.payload?.query || 'guitar backing track');
      window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener,noreferrer');
    }
    else if (action.type === 'SEARCH_VK') {
      const query = encodeURIComponent(action.payload.query);
      window.open(`https://vk.com/video?q=${query}`, '_blank', 'noopener,noreferrer');
    }
    else if (action.type === 'SEARCH_RUTUBE') {
      const query = encodeURIComponent(action.payload.query);
      window.open(`https://rutube.ru/search/?query=${query}`, '_blank', 'noopener,noreferrer');
    }
    else if (action.type === 'SET_CONTEXT') {
      console.log('🎯 Setting context:', action.payload);
    }
  };

  return (
    <div className="app-container">
      <Header onAIAction={handleAIAction} />
      
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div className="app-layout">
          <aside className="left-sidebar">
              <div 
                onClick={() => setActiveModule('engine')} 
                style={{ 
                  padding: '12px', 
                  background: activeModule === 'engine' ? 'var(--bg-hover)' : 'transparent', 
                  color: activeModule === 'engine' ? 'var(--accent)' : 'var(--text-muted)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontSize: '24px', 
                  transition: '0.2s',
                  position: 'relative',
                }} 
                title="Fretboard Engine"
              >
                🎸
                {activeModule === 'engine' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent)'
                  }} />
                )}
              </div>
              
              <div 
                onClick={() => setActiveModule('dictionary')} 
                style={{ 
                  padding: '12px', 
                  background: activeModule === 'dictionary' ? 'var(--bg-hover)' : 'transparent', 
                  color: activeModule === 'dictionary' ? 'var(--accent)' : 'var(--text-muted)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontSize: '24px', 
                  transition: '0.2s',
                  position: 'relative',
                }} 
                title="Chord Dictionary"
              >
                📖
                {activeModule === 'dictionary' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent)'
                  }} />
                )}
              </div>
              
              {/* 🔥 ИЗМЕНЕНО: используем SoloGenerator вместо AutoTab */}
              <div 
                onClick={() => setActiveModule('autotab')} 
                style={{ 
                  padding: '12px', 
                  background: activeModule === 'autotab' ? 'var(--bg-hover)' : 'transparent', 
                  color: activeModule === 'autotab' ? 'var(--accent)' : 'var(--text-muted)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontSize: '24px', 
                  transition: '0.2s',
                  position: 'relative',
                }} 
                title="Solo Generator"
              >
                🎼
                {activeModule === 'autotab' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent)'
                  }} />
                )}
              </div>

              <div 
                onClick={() => setActiveModule('practice')} 
                style={{ 
                  padding: '12px', 
                  background: activeModule === 'practice' ? 'var(--bg-hover)' : 'transparent', 
                  color: activeModule === 'practice' ? 'var(--accent)' : 'var(--text-muted)', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  fontSize: '24px', 
                  transition: '0.2s',
                  position: 'relative',
                }} 
                title="Practice Module"
              >
                🏋️
                {activeModule === 'practice' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    boxShadow: '0 0 10px var(--accent)'
                  }} />
                )}
              </div>
          </aside>

          <div className="main-workspace">
            {activeModule === 'engine' && (
              <>
                <main className="center-column">
                    <Player />
                    <div className="fretboard-scroll-wrapper"><Fretboard /></div>
                    <Tablature />
                </main>
                
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
                  <SoloGenerator /> {/* 🔥 ЗАМЕНА */}
              </main>
            )}

            {activeModule === 'practice' && (
              <main className="center-column" style={{ overflowY: 'hidden' }}>
                  <PracticeDashboard />
              </main>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;