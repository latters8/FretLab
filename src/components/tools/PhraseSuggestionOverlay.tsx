/**
 * 🎯 PhraseSuggestionOverlay — интерактивный режим подсказок
 * 
 * Показывает рекомендуемые ноты и фразы для обыгрывания текущего аккорда
 * в реальном времени. Работает совместно с AIEngine.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  getSuggestedNotesForChord, 
  getPhraseSuggestions,
  type SuggestionNote,
  type PhraseSuggestion,
  type LickNote,
  findFretForNote,
  predictNextNote
} from '../../services/AIEngine';
import { audioManager } from '../../services/AudioManager';

interface PhraseSuggestionOverlayProps {
  currentChord: { name: string; notes: string[] };
  scaleNotes: string[];
  keyNote: string;
  mode: string;
  isActive: boolean;
  onNoteClick?: (note: SuggestionNote) => void;
  onPhraseSelect?: (phrase: PhraseSuggestion) => void;
  lastFret?: number;
}

const PhraseSuggestionOverlay: React.FC<PhraseSuggestionOverlayProps> = ({
  currentChord,
  scaleNotes,
  keyNote,
  mode,
  isActive,
  onNoteClick,
  onPhraseSelect,
  lastFret = 5
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'phrases' | 'predict'>('notes');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [hoveredNote, setHoveredNote] = useState<SuggestionNote | null>(null);

  // Рекомендуемые ноты для текущего аккорда
  const suggestedNotes = useMemo(() => {
    if (!isActive || !currentChord) return [];
    return getSuggestedNotesForChord(currentChord, scaleNotes, keyNote);
  }, [currentChord, scaleNotes, keyNote, isActive]);

  // Рекомендуемые фразы
  const phraseSuggestions = useMemo(() => {
    if (!isActive || !currentChord) return [];
    return getPhraseSuggestions(currentChord, keyNote, mode, selectedDifficulty);
  }, [currentChord, keyNote, mode, selectedDifficulty, isActive]);

  // Предсказание следующей ноты
  const predictedNotes = useMemo(() => {
    if (!isActive || !currentChord) return [];
    return predictNextNote([], scaleNotes, keyNote, mode, lastFret);
  }, [scaleNotes, keyNote, mode, lastFret, isActive, currentChord]);

  // Воспроизведение ноты при клике
  const handleNoteClick = useCallback(async (note: SuggestionNote) => {
    await audioManager.init();
    const freq = 440 * Math.pow(2, (note.note.charCodeAt(0) - 69 + 12) / 12);
    audioManager.playGuitarNote(freq, 0.5, undefined, 0.7);
    onNoteClick?.(note);
  }, [onNoteClick]);

  // Воспроизведение фразы
  const handlePhrasePlay = useCallback(async (phrase: PhraseSuggestion) => {
    await audioManager.init();
    const stringToFreq = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];
    
    phrase.notes.forEach((note: LickNote, i: number) => {
      if (note.isRest || note.fret === null) return;
      const freq = stringToFreq[note.string] * Math.pow(2, note.fret / 12);
      const delay = i * 0.25;
      setTimeout(() => {
        audioManager.playGuitarNote(freq, 0.5, undefined, note.velocity || 0.7);
      }, delay * 1000);
    });
    
    onPhraseSelect?.(phrase);
  }, [onPhraseSelect]);

  if (!isActive) return null;

  const categoryColors: Record<string, string> = {
    chordTone: '#00FF9D',
    tension: '#ffd93d',
    approach: '#ff6b6b',
    beginner: '#6bcb77',
    intermediate: '#ffd93d',
    advanced: '#ff6b6b',
    predict: '#4d96ff',
  };

  return (
    <div style={{
      width: '100%',
      background: '#0d0e14',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: 'linear-gradient(180deg, #151620 0%, #0d0e14 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🎯</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>
            Interactive Mode
          </span>
          <span style={{
            fontSize: '9px',
            padding: '2px 8px',
            borderRadius: '8px',
            background: 'rgba(0,255,157,0.1)',
            color: '#00FF9D',
            fontWeight: 700,
            border: '1px solid rgba(0,255,157,0.2)',
          }}>
            LIVE
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
          {currentChord.name}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {[
          { key: 'notes', label: '🎵 Notes', count: suggestedNotes.length },
          { key: 'phrases', label: '🎸 Phrases', count: phraseSuggestions.length },
          { key: 'predict', label: '🔮 Predict', count: predictedNotes.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #00FF9D' : '2px solid transparent',
              color: activeTab === tab.key ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              transition: '0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {tab.label}
            <span style={{
              fontSize: '9px',
              padding: '1px 6px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.4)',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px', maxHeight: '280px', overflowY: 'auto' }}>
        
        {/* 🎵 NOTES TAB */}
        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', fontWeight: 600 }}>
              Recommended notes for <strong style={{ color: '#00FF9D' }}>{currentChord.name}</strong>
            </div>
            {suggestedNotes.map((note, i) => (
              <div
                key={`note-${i}`}
                onClick={() => handleNoteClick(note)}
                onMouseEnter={() => setHoveredNote(note)}
                onMouseLeave={() => setHoveredNote(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: hoveredNote === note ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: `1px solid ${
                    note.isChordTone ? `${categoryColors.chordTone}33` :
                    note.isTension ? `${categoryColors.tension}33` :
                    `${categoryColors.approach}33`
                  }`,
                  cursor: 'pointer',
                  transition: '0.1s',
                }}
              >
                {/* Color indicator */}
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: note.isChordTone ? categoryColors.chordTone :
                    note.isTension ? categoryColors.tension :
                    categoryColors.approach,
                  boxShadow: hoveredNote === note ? `0 0 8px ${
                    note.isChordTone ? categoryColors.chordTone :
                    note.isTension ? categoryColors.tension :
                    categoryColors.approach
                  }` : 'none',
                }} />
                
                {/* Note name */}
                <span style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: '#fff',
                  minWidth: '30px',
                }}>
                  {note.note}
                </span>
                
                {/* Fret position */}
                <span style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'monospace',
                }}>
                  fret {note.fret}
                </span>
                
                {/* Label */}
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: note.isChordTone ? categoryColors.chordTone :
                    note.isTension ? categoryColors.tension :
                    categoryColors.approach,
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: `rgba(255,255,255,0.04)`,
                }}>
                  {note.label}
                </span>
                
                {/* Play icon */}
                <span style={{ fontSize: '12px', opacity: hoveredNote === note ? 1 : 0.3 }}>▶</span>
              </div>
            ))}
            {suggestedNotes.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px' }}>
                No suggestions available for this chord
              </div>
            )}
          </div>
        )}

        {/* 🎸 PHRASES TAB */}
        {activeTab === 'phrases' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Difficulty filter */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {(['beginner', 'intermediate', 'advanced'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  style={{
                    padding: '2px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedDifficulty === diff ? categoryColors[diff] : 'rgba(255,255,255,0.04)',
                    color: selectedDifficulty === diff ? '#000' : 'rgba(255,255,255,0.4)',
                    fontSize: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>
            
            {phraseSuggestions.map((phrase, i) => (
              <div
                key={phrase.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: '0.15s',
                }}
                onClick={() => handlePhrasePlay(phrase)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,157,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>
                      {phrase.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                      {phrase.description}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '9px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: `${categoryColors[phrase.difficulty]}22`,
                      color: categoryColors[phrase.difficulty],
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}>
                      {phrase.difficulty}
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                      {phrase.notes.length} notes
                    </span>
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>▶</span>
                  </div>
                </div>
                
                {/* Mini fret preview */}
                <div style={{
                  display: 'flex',
                  gap: '3px',
                  marginTop: '6px',
                  padding: '4px 0',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  paddingTop: '6px',
                }}>
                  {phrase.notes.slice(0, 8).map((note, ni) => (
                    <div key={ni} style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      background: note.isRest ? 'rgba(255,255,255,0.05)' : '#00FF9D22',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '7px',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: note.isRest ? 'rgba(255,255,255,0.2)' : '#00FF9D',
                    }}>
                      {note.isRest ? 'R' : note.fret}
                    </div>
                  ))}
                  {phrase.notes.length > 8 && (
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center' }}>
                      +{phrase.notes.length - 8}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 🔮 PREDICT TAB */}
        {activeTab === 'predict' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px', fontWeight: 600 }}>
              Next note predictions (near fret {lastFret})
            </div>
            {predictedNotes.map((note, i) => (
              <div
                key={`pred-${i}`}
                onClick={() => handleNoteClick(note)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${categoryColors.predict}33`,
                  cursor: 'pointer',
                  transition: '0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: categoryColors.predict,
                }} />
                <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: '#fff', minWidth: '30px' }}>
                  {note.note}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                  fret {note.fret} <span style={{ color: 'rgba(255,255,255,0.15)' }}>| distance {Math.abs(note.fret - lastFret)}</span>
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: categoryColors.predict,
                  padding: '2px 8px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                }}>
                  {note.label}
                </span>
              </div>
            ))}
            {predictedNotes.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px' }}>
                No predictions available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '6px 16px',
        background: 'rgba(0,0,0,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        fontSize: '9px',
        color: 'rgba(255,255,255,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Click any note to hear it</span>
        <span>Key: {keyNote} {mode}</span>
      </div>
    </div>
  );
};

export default PhraseSuggestionOverlay;
