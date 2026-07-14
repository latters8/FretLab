// src/components/layout/AppShell.tsx

import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import Player from '../player/Player';
import CircleOfFifths from '../tools/CircleOfFifths';
import Fretboard from '../fretboard/Fretboard';
import Tablature from '../fretboard/Tablature';
import DiatonicChords from '../tools/DiatonicChords';
import ChordDictionary from '../tools/ChordDictionary';
import SoloGenerator from '../tools/SoloGenerator';
import ToolBox from '../tools/ToolBox';
import PracticeDashboard from '../PracticeDashboard';
import { useMusic } from '../../context/MusicContext';

type ModuleType = 'engine' | 'dictionary' | 'autotab' | 'practice' | 'settings';

const MODULES = {
  engine: { icon: '🎸', title: 'Fretboard Engine', description: 'Interactive fretboard with playback' },
  dictionary: { icon: '📖', title: 'Chord Dictionary', description: 'Explore chords and voicings' },
  autotab: { icon: '🎼', title: 'Solo Generator', description: 'AI-powered solo generation' },
  practice: { icon: '🏋️', title: 'Practice Dashboard', description: 'Track your progress' },
  settings: { icon: '⚙️', title: 'Settings', description: 'App preferences' },
} as const;

const AppShell: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('engine');
  const [aiTargetChord, setAiTargetChord] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const { setBpm } = useMusic();

  const handleAIAction = useCallback((action: any) => {
    if (!action) return;
    
    console.log('🔊 AppShell received action:', action);
    
    const switchModule = (module: ModuleType) => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveModule(module);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 200);
    };
    
    switch (action.type) {
      case 'SET_BPM':
        if (action.payload?.bpm) {
          setBpm(action.payload.bpm);
          console.log('🎵 BPM set to:', action.payload.bpm);
        }
        break;
      
      case 'OPEN_CHORD':
        setAiTargetChord(action.payload?.chord || null);
        switchModule('dictionary');
        break;
      
      case 'OPEN_TAB_GEN':
      case 'OPEN_AUTOTAB':
        switchModule('autotab');
        break;
      
      case 'OPEN_ENGINE':
        switchModule('engine');
        break;
      
      case 'OPEN_PRACTICE':
        switchModule('practice');
        break;
      
      case 'SEARCH_BACKING':
      case 'SEARCH_YOUTUBE':
        switchModule('engine');
        const ytQuery = encodeURIComponent(action.payload?.query || 'guitar backing track');
        window.open(`https://www.youtube.com/results?search_query=${ytQuery}`, '_blank', 'noopener,noreferrer');
        break;
      
      case 'SEARCH_VK':
        const vkQuery = encodeURIComponent(action.payload?.query || '');
        window.open(`https://vk.com/video?q=${vkQuery}`, '_blank', 'noopener,noreferrer');
        break;
      
      case 'SEARCH_RUTUBE':
        const ruQuery = encodeURIComponent(action.payload?.query || '');
        window.open(`https://rutube.ru/search/?query=${ruQuery}`, '_blank', 'noopener,noreferrer');
        break;
      
      case 'SET_CONTEXT':
        console.log('🎯 Setting context:', action.payload);
        break;
      
      default:
        console.warn('⚠️ Unknown action type:', action.type);
    }
  }, [setBpm]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const modules: ModuleType[] = ['engine', 'dictionary', 'autotab', 'practice', 'settings'];
        const index = parseInt(e.key) - 1;
        if (index < modules.length) {
          setActiveModule(modules[index]);
        }
      }
      if (e.key === 'Escape') {
        setAiTargetChord(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleModuleClick = (module: ModuleType) => {
    setActiveModule(module);
  };

  const renderNavIcon = (module: ModuleType) => {
    const isActive = activeModule === module;
    const config = MODULES[module];
    
    return (
      <div 
        onClick={() => handleModuleClick(module)}
        style={{ 
          padding: '12px', 
          background: isActive ? 'var(--bg-hover)' : 'transparent', 
          color: isActive ? 'var(--accent)' : 'var(--text-muted)', 
          borderRadius: '12px', 
          cursor: 'pointer', 
          fontSize: '24px', 
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isActive ? 'inset 0 0 30px rgba(0,255,157,0.05)' : 'none',
        }}
        title={config.title}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        {config.icon}
        {isActive && (
          <>
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 20px var(--accent)',
              animation: 'pulse-dot 2s infinite'
            }} />
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 10px var(--accent)',
              animation: 'pulse-dot 1.5s infinite'
            }} />
          </>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeModule) {
      case 'engine':
        return (
          <>
            <main className="center-column">
              <Player />
              <div className="fretboard-scroll-wrapper">
                <Fretboard />
              </div>
              <Tablature />
            </main>
            
            <aside className="right-column" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px', 
              overflowY: 'auto', 
              height: '100%',
              padding: '8px 0'
            }}>
              <CircleOfFifths />
              <DiatonicChords />
              <ToolBox />
            </aside>
          </>
        );

      case 'dictionary':
        return (
          <main className="center-column" style={{ overflowY: 'hidden' }}>
            <ChordDictionary targetChord={aiTargetChord} />
          </main>
        );

      case 'autotab':
        return (
          <main className="center-column" style={{ overflowY: 'hidden' }}>
            <SoloGenerator />
          </main>
        );

      case 'practice':
        return (
          <main className="center-column" style={{ overflowY: 'hidden' }}>
            <PracticeDashboard />
          </main>
        );

      case 'settings':
        return (
          <main className="center-column" style={{ 
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}>
            <div style={{
              maxWidth: '600px',
              width: '100%',
              background: 'var(--bg-panel)',
              borderRadius: 'var(--radius)',
              padding: '32px',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '24px' }}>
                ⚙️ Settings
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Theme
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)'
                  }}>
                    <option>Dark</option>
                    <option>Light</option>
                    <option>System</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Language
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)'
                  }}>
                    <option>English</option>
                    <option>Русский</option>
                    <option>Deutsch</option>
                    <option>Español</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    MIDI Input
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)'
                  }}>
                    <option>None</option>
                    <option>MIDI Device 1</option>
                    <option>MIDI Device 2</option>
                  </select>
                </div>
                <button style={{
                  padding: '10px 20px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '8px'
                }}>
                  Save Settings
                </button>
              </div>
            </div>
          </main>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Header onAIAction={handleAIAction} />
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div className="app-layout">
          <aside className="left-sidebar" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '12px'
          }}>
            {renderNavIcon('engine')}
            {renderNavIcon('dictionary')}
            {renderNavIcon('autotab')}
            {renderNavIcon('practice')}
            {renderNavIcon('settings')}
            
            <div style={{
              marginTop: 'auto',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
              width: '80%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ 
                fontSize: '10px', 
                color: 'var(--text-muted)',
                opacity: 0.5,
                textAlign: 'center'
              }}>
                v2.0.0
              </span>
              <span style={{ 
                fontSize: '8px', 
                color: 'var(--text-muted)',
                opacity: 0.3,
                textAlign: 'center'
              }}>
                Ctrl+1-5
              </span>
            </div>
          </aside>

          <div className="main-workspace" style={{
            position: 'relative',
            opacity: isTransitioning ? 0.8 : 1,
            transition: 'opacity 0.3s ease'
          }}>
            {renderContent()}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { 
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% { 
            opacity: 0.5;
            transform: translateX(-50%) scale(1.5);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .center-column {
          animation: fadeIn 0.3s ease;
        }
        
        .right-column::-webkit-scrollbar,
        .center-column::-webkit-scrollbar {
          width: 4px;
        }
        
        .right-column::-webkit-scrollbar-track,
        .center-column::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .right-column::-webkit-scrollbar-thumb,
        .center-column::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 2px;
        }
        
        .right-column::-webkit-scrollbar-thumb:hover,
        .center-column::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default AppShell;