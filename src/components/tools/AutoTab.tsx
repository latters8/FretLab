import React, { useState } from 'react';

type Step = 'upload' | 'processing' | 'result';

const AutoTab: React.FC = () => {
  const [step, setStep] = useState<Step>('upload');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

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
    setLogs(['Initiating FretLab AutoTablature Engine...']);
    
    const steps = [
      { p: 15, msg: 'Separating audio stems (Demucs v4)...' },
      { p: 35, msg: 'Isolating Guitars & Bass...' },
      { p: 60, msg: 'Running Pitch Tracking (Tab-It AI)...' },
      { p: 85, msg: 'Aligning rhythm and generating SVG Tablature...' },
      { p: 100, msg: 'Done! Opening Songsterr-mode...' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setLogs(prev => [...prev, steps[currentStep].msg]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => setStep('result'), 800);
      }
    }, 1200);
  };

  return (
    <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      
      {/* Header */}
      <div style={{ padding: '18px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🎼</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>AI AutoTab & Transcription</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Powered by Tab-It & AutoTablature Models</span>
          </div>
        </div>
        {step === 'result' && (
          <button onClick={() => setStep('upload')} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
            Upload New File
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
            <div style={{ fontSize: '48px' }}>📥</div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Drag & Drop Audio File</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Supports MP3, WAV, FLAC or YouTube Links</p>
            
            <label style={{ marginTop: '12px', background: 'var(--accent)', color: '#000', padding: '10px 24px', borderRadius: '24px', fontWeight: 800, cursor: 'pointer' }}>
              BROWSE FILES
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
              <div style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: '8px' }}>Processing: {fileName}</div>
              {logs.map((log, i) => (
                <div key={i} style={{ opacity: i === logs.length - 1 ? 1 : 0.5 }}>{'>'} {log}</div>
              ))}
            </div>
          </div>
        )}

        {step === 'result' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{fileName.replace(/\.[^/.]+$/, "")}</h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Key: E Minor | BPM: 120 | Generated by AutoTablature</div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ background: 'var(--accent)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000' }}>▶</button>
              </div>
            </div>

            {/* Fake Songsterr-like Tab UI */}
            <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
               <svg viewBox="0 0 800 120" style={{ width: '100%', minWidth: '600px' }}>
                 {[0,1,2,3,4,5].map(i => <line key={i} x1="20" y1={20+i*15} x2="780" y2={20+i*15} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>)}
                 {['e','B','G','D','A','E'].map((n, i) => <text key={n} x="0" y={24+i*15} fill="var(--text-muted)" fontSize="12" fontFamily="monospace">{n}</text>)}
                 
                 {/* Fake Notes */}
                 <text x="100" y="24" fill="var(--text-primary)" fontSize="14" fontWeight="800">12</text>
                 <text x="130" y="39" fill="var(--text-primary)" fontSize="14" fontWeight="800">15</text>
                 <text x="160" y="24" fill="var(--accent)" fontSize="14" fontWeight="800">12</text>
                 <text x="190" y="54" fill="var(--text-primary)" fontSize="14" fontWeight="800">14</text>
                 
                 <text x="300" y="84" fill="var(--text-primary)" fontSize="14" fontWeight="800">7</text>
                 <text x="300" y="99" fill="var(--text-primary)" fontSize="14" fontWeight="800">9</text>
                 <path d="M 135 30 Q 145 15 155 20" fill="transparent" stroke="var(--accent)" strokeWidth="2"/>
               </svg>
               <svg viewBox="0 0 800 120" style={{ width: '100%', minWidth: '600px', marginTop: '24px' }}>
                 {[0,1,2,3,4,5].map(i => <line key={i} x1="20" y1={20+i*15} x2="780" y2={20+i*15} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>)}
                 {['e','B','G','D','A','E'].map((n, i) => <text key={n} x="0" y={24+i*15} fill="var(--text-muted)" fontSize="12" fontFamily="monospace">{n}</text>)}
                 <text x="50" y="84" fill="var(--text-primary)" fontSize="14" fontWeight="800">5</text>
                 <text x="50" y="99" fill="var(--text-primary)" fontSize="14" fontWeight="800">7</text>
                 <text x="150" y="84" fill="var(--text-primary)" fontSize="14" fontWeight="800">7</text>
                 <text x="150" y="99" fill="var(--text-primary)" fontSize="14" fontWeight="800">9</text>
                 <line x1="65" y1="80" x2="135" y2="80" stroke="var(--text-muted)" strokeWidth="2" opacity="0.5"/>
               </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoTab;