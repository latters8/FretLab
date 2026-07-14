import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { findFretForNote } from '../../services/AIEngine';

type Step = 'upload' | 'processing' | 'result';

interface TabNote {
  x: number;
  string: number;
  fret: number | null;
  isRest: boolean;
  articulation: 'none' | 'vibrato';
}

const DURATION_WEIGHTS = [
  { dur: '16n', weight: 50, width: 35 }, 
  { dur: '8n',  weight: 30, width: 60 }, 
  { dur: '4n',  weight: 15, width: 120}, 
  { dur: '8t',  weight: 5,  width: 45 }  
];

const AutoTab: React.FC = () => {
  const { getScaleNotes, keyNote, mode } = useMusic(); // Подключаем контекст!

  const [step, setStep] = useState<Step>('upload');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  
  const [tabData, setTabData] = useState<{phrase: TabNote[], totalWidth: number} | null>(null);

  const generateHumanPhrase = () => {
    // 1. ПОЛУЧАЕМ НОТЫ ТЕКУЩЕЙ ТОНАЛЬНОСТИ ИЗ КОНТЕКСТА
    const scaleNotes = getScaleNotes();
    const safeScale = scaleNotes && scaleNotes.length > 0 ? scaleNotes : ['C', 'D', 'E', 'G', 'A'];
    
    // 2. ДИНАМИЧЕСКИ СТРОИМ БОКС АППЛИКАТУРЫ (CAGED) ДЛЯ ЭТОЙ ГАММЫ
    let DYNAMIC_BOX: { s: number, f: number }[] = [];
    
    // Сканируем гриф с 6 по 1 струну (в коде 5 -> 0)
    for (let s = 5; s >= 0; s--) {
      for (const note of safeScale) {
        // Ищем лады в удобной средней позиции грифа (с 3 по 14 лад)
        const fret = findFretForNote(note, s, 3, 14);
        if (fret >= 3 && fret <= 14) {
          DYNAMIC_BOX.push({ s, f: fret });
        }
      }
    }
    
    // Убираем возможные дубликаты и сортируем от толстых струн к тонким
    const uniqueBox = Array.from(new Set(DYNAMIC_BOX.map(n => `${n.s}-${n.f}`)))
      .map(str => {
        const [s, f] = str.split('-');
        return { s: Number(s), f: Number(f) };
      });
      
    uniqueBox.sort((a, b) => {
       if (a.s !== b.s) return b.s - a.s; 
       return a.f - b.f; 
    });

    // Страховка (если гамма пустая, ставим дефолт)
    if (uniqueBox.length === 0) {
      uniqueBox.push({ s: 3, f: 5 }, { s: 3, f: 7 }, { s: 2, f: 5 }, { s: 2, f: 7 });
    }

    // 3. ГЕНЕРИРУЕМ ФРАЗУ ПО ДИНАМИЧЕСКОМУ БОКСУ
    let currentX = 60;
    const phrase: TabNote[] = [];
    
    let currentScaleIdx = Math.floor(uniqueBox.length / 2); 
    let direction = Math.random() > 0.5 ? 1 : -1; 
    let notesInBurst = 0;
    let maxBurst = Math.floor(Math.random() * 5) + 3; 

    for (let i = 0; i < 35; i++) { 
      
      if (notesInBurst >= maxBurst) {
        const isLongRest = Math.random() > 0.5;
        phrase.push({ x: currentX, string: 0, fret: null, isRest: true, articulation: 'none' });
        currentX += isLongRest ? 120 : 60;
        notesInBurst = 0;
        maxBurst = Math.floor(Math.random() * 5) + 3;
        if (Math.random() > 0.4) direction *= -1;
        continue;
      }

      if (Math.random() > 0.8) direction *= -1; 

      if (Math.random() > 0.85) {
        currentScaleIdx += direction * (Math.floor(Math.random() * 2) + 2); 
      } else {
        currentScaleIdx += direction;
      }

      if (currentScaleIdx < 0) {
        currentScaleIdx = Math.abs(currentScaleIdx); 
        direction = 1;
      } else if (currentScaleIdx >= uniqueBox.length) {
        currentScaleIdx = uniqueBox.length - 2; 
        direction = -1;
      }

      const totalWeight = DURATION_WEIGHTS.reduce((a, b) => a + b.weight, 0);
      let rnd = Math.random() * totalWeight;
      let selectedDur = DURATION_WEIGHTS[1];
      for (const d of DURATION_WEIGHTS) {
        if (rnd < d.weight) { selectedDur = d; break; }
        rnd -= d.weight;
      }

      const isLongNote = selectedDur.dur === '4n';
      
      phrase.push({
        x: currentX,
        string: uniqueBox[currentScaleIdx].s,
        fret: uniqueBox[currentScaleIdx].f,
        isRest: false,
        articulation: isLongNote && Math.random() > 0.3 ? 'vibrato' : 'none'
      });

      currentX += selectedDur.width;
      notesInBurst++;
    }

    return { phrase, totalWidth: currentX + 60 };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    let name = 'Unknown Track.mp3';
    
    if ('dataTransfer' in e && e.dataTransfer.files.length > 0) {
      name = e.dataTransfer.files[0].name;
    } else if ('target' in e && (e.target as HTMLInputElement).files?.length) {
      name = (e.target as HTMLInputElement).files![0].name;
    }
    
    setFileName(name);
    setStep('processing');
    simulateProcessing();
  };

  const simulateProcessing = () => {
    setProgress(0);
    setLogs(['Initiating FretLab Human-Phrasing AI...']);
    
    const steps = [
      { p: 15, msg: `Extracting ${keyNote} tonal centers...` },
      { p: 40, msg: `Mapping ${mode.replace(/_/g, ' ')} CAGED boxes...` },
      { p: 65, msg: 'Applying rhythmic momentum and inertia...' },
      { p: 85, msg: 'Injecting organic rests and vibrato articulations...' },
      { p: 100, msg: 'Done! Rendering generated tablature...' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setLogs(prev => [...prev, steps[currentStep].msg]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTabData(generateHumanPhrase());
        setTimeout(() => setStep('result'), 800);
      }
    }, 1000);
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      
      <div style={{ padding: '18px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🎼</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>AI Solo Generator & Transcription</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organic Phrasing Engine v2.0</span>
          </div>
        </div>
        {step === 'result' && (
          <button onClick={() => setStep('upload')} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 800 }}>
            Generate New Solo
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto', background: 'var(--bg-root)' }}>
        
        {step === 'upload' && (
          <div 
            onDragOver={e => e.preventDefault()} 
            onDrop={handleFileUpload}
            style={{ flex: 1, border: '2px dashed var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg-primary)', transition: '0.2s', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <div style={{ fontSize: '48px' }}>🎸</div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Upload Track to Generate Solo</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Our AI will analyze the key and generate a human-like solo.</p>
            
            <label style={{ marginTop: '12px', background: 'var(--accent)', color: '#000', padding: '10px 24px', borderRadius: '24px', fontWeight: 800, cursor: 'pointer' }}>
              PROCESS AUDIO
              <input type="file" style={{ display: 'none' }} accept="audio/*" onChange={handleFileUpload} />
            </label>
          </div>
        )}

        {step === 'processing' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
            <div style={{ width: '60%', background: 'var(--bg-secondary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, background: 'var(--accent)', height: '100%', transition: 'width 0.5s ease-out', boxShadow: '0 0 10px var(--accent)' }} />
            </div>
            
            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', width: '60%', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '12px', color: 'var(--accent)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '8px' }}>Analyzing Context: {fileName}</div>
              {logs.map((log, i) => (
                <div key={i} style={{ opacity: i === logs.length - 1 ? 1 : 0.5 }}>{'>'} {log}</div>
              ))}
            </div>
          </div>
        )}

        {step === 'result' && tabData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{fileName.replace(/\.[^/.]+$/, "")} (Generated Solo)</h2>
                {/* 🔥 ИСПРАВЛЕНО: Текст показывает реальную тональность! */}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Key: {keyNote} {mode.replace(/_/g, ' ')} | Dynamic Box Phrasing</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ background: 'var(--accent)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000', fontSize: '16px', boxShadow: '0 0 12px var(--accent)' }}>▶</button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
               <svg viewBox={`0 0 ${tabData.totalWidth} 120`} style={{ width: tabData.totalWidth, minWidth: '800px', display: 'block' }}>
                 
                 {[0,1,2,3,4,5].map(i => <line key={i} x1="20" y1={20+i*15} x2={tabData.totalWidth - 20} y2={20+i*15} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>)}
                 
                 {['e','B','G','D','A','E'].map((n, i) => <text key={n} x="0" y={24+i*15} fill="var(--text-muted)" fontSize="12" fontFamily="monospace">{n}</text>)}
                 
                 {tabData.phrase.map((n, i) => {
                   if (n.isRest) return null; 
                   
                   const yPos = 24 + n.string * 15;
                   
                   return (
                     <g key={i}>
                       <rect x={n.x - 10} y={yPos - 12} width="20" height="16" fill="var(--bg-panel)" />
                       <text x={n.x} y={yPos} fill="var(--text-primary)" fontSize="14" fontWeight="900" textAnchor="middle">{n.fret}</text>
                       
                       {n.articulation === 'vibrato' && (
                         <path 
                           d={`M ${n.x - 6} ${yPos - 18} Q ${n.x - 3} ${yPos - 21} ${n.x} ${yPos - 18} T ${n.x + 6} ${yPos - 18}`} 
                           fill="transparent" 
                           stroke="var(--accent)" 
                           strokeWidth="1.5"
                         />
                       )}
                     </g>
                   );
                 })}
               </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoTab;