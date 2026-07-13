import React, { useState } from 'react';

type Step = 'upload' | 'processing' | 'result';

interface TabNote {
  x: number;
  string: number;
  fret: number | null;
  isRest: boolean;
  articulation: 'none' | 'vibrato';
}

// Вероятностная модель длительностей (взвешенный рандом)
const DURATION_WEIGHTS = [
  { dur: '16n', weight: 45, width: 30 }, // Быстрые ноты (шаг 30px)
  { dur: '8n',  weight: 35, width: 60 }, // Средние ноты (шаг 60px)
  { dur: '4n',  weight: 15, width: 120}, // Длинные ноты (шаг 120px)
  { dur: '8t',  weight: 5,  width: 40 }  // Триоли (шаг 40px)
];

// Бокс Ми-минорной пентатоники (12 позиция) от тонкой к толстой
const SCALE_BOX = [
  { s: 0, f: 15 }, { s: 0, f: 12 },
  { s: 1, f: 15 }, { s: 1, f: 12 },
  { s: 2, f: 14 }, { s: 2, f: 12 },
  { s: 3, f: 14 }, { s: 3, f: 12 },
  { s: 4, f: 14 }, { s: 4, f: 12 },
  { s: 5, f: 15 }, { s: 5, f: 12 }
];

const AutoTab: React.FC = () => {
  const [step, setStep] = useState<Step>('upload');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  
  // Хранилище сгенерированной человечной фразы
  const [tabData, setTabData] = useState<{phrase: TabNote[], totalWidth: number} | null>(null);

  // 🔥 ЯДРО АЛГОРИТМА ЧЕЛОВЕЧНОСТИ (HUMAN PHRASING ENGINE)
  const generateHumanPhrase = () => {
    let currentX = 60; // Начальный отступ
    const phrase: TabNote[] = [];
    
    let currentScaleIdx = 5; // Начинаем где-то с 3-й струны
    let notesInBurst = 0;
    let maxBurst = Math.floor(Math.random() * 4) + 3; // "Пачка" от 3 до 6 нот

    for (let i = 0; i < 30; i++) { // Генерируем фразу из ~30 элементов
      
      // 1. ЛОГИКА ДЫХАНИЯ: Если сыграли пачку, делаем паузу
      if (notesInBurst >= maxBurst) {
        const isLongRest = Math.random() > 0.5;
        const restWidth = isLongRest ? 120 : 60;
        
        phrase.push({ x: currentX, string: 0, fret: null, isRest: true, articulation: 'none' });
        
        currentX += restWidth;
        notesInBurst = 0;
        maxBurst = Math.floor(Math.random() * 5) + 2; // Следующая пачка будет другой длины
        continue;
      }

      // 2. ЛОГИКА ПЛАВНОСТИ: 75% шанс сыграть соседнюю ноту в боксе, 25% скачок
      if (Math.random() > 0.25) {
        const step = Math.random() > 0.5 ? 1 : -1;
        currentScaleIdx = Math.max(0, Math.min(SCALE_BOX.length - 1, currentScaleIdx + step));
      } else {
        currentScaleIdx = Math.floor(Math.random() * SCALE_BOX.length);
      }

      // 3. ЛОГИКА РИТМИКИ: Взвешенный рандом
      const totalWeight = DURATION_WEIGHTS.reduce((a, b) => a + b.weight, 0);
      let rnd = Math.random() * totalWeight;
      let selectedDur = DURATION_WEIGHTS[1];
      for (const d of DURATION_WEIGHTS) {
        if (rnd < d.weight) { selectedDur = d; break; }
        rnd -= d.weight;
      }

      // 4. ЛОГИКА АРТИКУЛЯЦИИ: Длинные ноты получают вибрато
      const isLongNote = selectedDur.dur === '4n';
      
      phrase.push({
        x: currentX,
        string: SCALE_BOX[currentScaleIdx].s,
        fret: SCALE_BOX[currentScaleIdx].f,
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
      { p: 15, msg: 'Extracting tonal centers & scales...' },
      { p: 40, msg: 'Mapping pentatonic CAGED boxes...' },
      { p: 65, msg: 'Applying rhythmic weighted randomization...' },
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
        // Генерируем УНИКАЛЬНУЮ табулатуру перед показом
        setTabData(generateHumanPhrase());
        setTimeout(() => setStep('result'), 800);
      }
    }, 1000);
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      
      {/* Header */}
      <div style={{ padding: '18px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🎼</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>AI Solo Generator & Transcription</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Organic Phrasing Engine</span>
          </div>
        </div>
        {step === 'result' && (
          <button onClick={() => setStep('upload')} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 800 }}>
            Generate New Solo
          </button>
        )}
      </div>

      {/* Main Area */}
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
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Key: E Minor Pentatonic | Organic Phrasing Applied</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ background: 'var(--accent)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000', fontSize: '16px', boxShadow: '0 0 12px var(--accent)' }}>▶</button>
              </div>
            </div>

            {/* ДИНАМИЧЕСКИЙ РЕНДЕР ТАБУЛАТУРЫ */}
            <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
               <svg viewBox={`0 0 ${tabData.totalWidth} 120`} style={{ width: tabData.totalWidth, minWidth: '800px', display: 'block' }}>
                 
                 {/* Линии струн */}
                 {[0,1,2,3,4,5].map(i => <line key={i} x1="20" y1={20+i*15} x2={tabData.totalWidth - 20} y2={20+i*15} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>)}
                 
                 {/* Названия струн слева */}
                 {['e','B','G','D','A','E'].map((n, i) => <text key={n} x="0" y={24+i*15} fill="var(--text-muted)" fontSize="12" fontFamily="monospace">{n}</text>)}
                 
                 {/* Отрисовка сгенерированных нот */}
                 {tabData.phrase.map((n, i) => {
                   if (n.isRest) return null; // Паузы просто оставляют пустое пространство (дыхание)
                   
                   const yPos = 24 + n.string * 15;
                   
                   return (
                     <g key={i}>
                       <rect x={n.x - 10} y={yPos - 12} width="20" height="16" fill="var(--bg-panel)" />
                       <text x={n.x} y={yPos} fill="var(--text-primary)" fontSize="14" fontWeight="900" textAnchor="middle">{n.fret}</text>
                       
                       {/* Отрисовка волны вибрато для длинных нот */}
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